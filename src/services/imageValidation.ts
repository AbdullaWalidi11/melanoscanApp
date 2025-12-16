import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { Buffer } from "buffer";

/**
 * 224x224 matches the Input Size of our EfficientNet Model.
 * Checking a larger image is slower and doesn't add much value for these heuristics.
 */
const RESIZE_WIDTH = 224;
const RESIZE_HEIGHT = 224; // Square aspect ratio is standard for models

interface ValidationResult {
  isValid: boolean;
  error?: string; // Human readable error
  validationStep?: string; // For UI feedback (e.g., "Checking Focus...")
  details?: {
    blurScore?: number;
    brightness?: number;
    skinPercentage?: number;
  };
}

// --- THRESHOLDS ---
const BLUR_THRESHOLD = 30; // Laplacian Variance. < 50 is usually blurry.
const DARK_THRESHOLD = 40; // < 40 is too dark.
const GLARE_THRESHOLD = 230; // > 230 is blown out.
const SKIN_MIN_PERCENTAGE = 0.1; // Reduced to 10% to be more tolerant of close-ups/backgrounds

export async function validateImageQuality(
  imageUri: string
): Promise<ValidationResult> {
  try {
    // 1. Resize & Get Base64
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: RESIZE_WIDTH, height: RESIZE_HEIGHT } }],
      { base64: true, format: ImageManipulator.SaveFormat.JPEG }
    );

    if (!result.base64) {
      return { isValid: false, error: "Could not process image data." };
    }

    // 2. Decode JPEG to Buffer
    const imageBuffer = Buffer.from(result.base64, "base64");
    const decoded = jpeg.decode(imageBuffer, { useTArray: true }); // Returns { width, height, data: Uint8Array [r,g,b,a, r,g,b,a ...] }
    const { data, width, height } = decoded;

    // --- STEP 1: LIGHTING CHECK ---
    const { brightness, glarePercentage } = calculateLightingStats(
      data,
      width,
      height
    );

    if (brightness < DARK_THRESHOLD) {
      return {
        isValid: false,
        error: "Too dark. Please turn on a light.",
        details: { brightness },
      };
    }

    // If more than 10% of the image is pure white/blown out, it's glare.
    if (brightness > GLARE_THRESHOLD || glarePercentage > 0.1) {
      return {
        isValid: false,
        error: "Too flashy. Avoid direct glare.",
        details: { brightness },
      };
    }

    // --- STEP 2: CLARITY CHECK (Blur) ---
    // We calculate the Variance of the Laplacian.
    // This is mathematically "how many edges are in the image".
    const blurScore = calculateLaplacianVariance(data, width, height);
    if (blurScore < BLUR_THRESHOLD) {
      return {
        isValid: false,
        error: "Image is not clear. Please hold steady.",
        details: { blurScore },
      };
    }

    // --- STEP 3: SKIN CONTENT CHECK ---
    const skinPercentage = calculateSkinPercentage(data, width, height);
    if (skinPercentage < SKIN_MIN_PERCENTAGE) {
      return {
        isValid: false,
        error: "No skin detected. Please align the lesion.",
        details: { skinPercentage },
      };
    }

    // SUCCESS
    return {
      isValid: true,
      details: {
        blurScore,
        brightness,
        skinPercentage,
      },
    };
  } catch (error) {
    console.error("Quality Check Failed:", error);
    // If our check crashes, we fallback to ALLOWING the image so we don't block users due to bugs.
    return { isValid: true };
  }
}

/**
 * Calculates average brightness and % of pixels that are potential glare.
 */
function calculateLightingStats(
  data: Uint8Array,
  width: number,
  height: number
) {
  let totalLuminance = 0;
  let glarePixels = 0;
  const numPixels = width * height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Standard Luma formula: 0.299R + 0.587G + 0.114B
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;

    if (luminance > 240) {
      glarePixels++;
    }
  }

  return {
    brightness: totalLuminance / numPixels,
    glarePercentage: glarePixels / numPixels,
  };
}

/**
 * Calculates variance of the Laplacian (Green channel only for speed).
 * A standard measure of image sharpness.
 */
function calculateLaplacianVariance(
  data: Uint8Array,
  width: number,
  height: number
) {
  // 1. Convert to Grayscale (Green channel is a good approximation for sharpness)
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = data[i + 1]; // Use Green Channel
  }

  // 2. Convolve with Laplacian Kernel
  // [0,  1, 0]
  // [1, -4, 1]
  // [0,  1, 0]
  const laplacianValues: number[] = [];
  let mean = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const top = grayscale[idx - width];
      const bottom = grayscale[idx + width];
      const left = grayscale[idx - 1];
      const right = grayscale[idx + 1];
      const center = grayscale[idx];

      const val = top + bottom + left + right - 4 * center;
      laplacianValues.push(val);
      mean += val;
    }
  }

  mean /= laplacianValues.length;

  // 3. Calculate Variance
  let variance = 0;
  for (const val of laplacianValues) {
    variance += (val - mean) * (val - mean);
  }
  return variance / laplacianValues.length;
}

/**
 * Detects skin color using RGB rules.
 * Simple rule: R > 95, G > 40, B > 20 AND Max - Min > 15 AND |R - G| > 15 AND R > G AND R > B
 */

// ...

export function calculateSkinPercentage(
  data: Uint8Array,
  width: number,
  height: number
) {
  let skinPixels = 0;
  const numPixels = width * height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Relaxed RGB rule for wider lighting conditions & skin tones
    const isSkin =
      r > 45 && // Lowered from 95 to support darker lighting
      g > 30 && // Lowered from 40
      b > 15 && // Lowered from 20
      max - min > 10 && // Reduced contrast requirement
      Math.abs(r - g) > 10 &&
      r > g &&
      r > b;

    if (isSkin) {
      skinPixels++;
    }
  }

  return skinPixels / numPixels;
}
