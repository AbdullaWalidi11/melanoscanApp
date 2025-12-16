import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ FIX: Import from 'legacy' to avoid runtime crash
import { readAsStringAsync } from "expo-file-system/legacy";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface ComparisonResult {
  valid: boolean;
  code: "SUCCESS" | "IRRELEVANT" | "POOR_QUALITY";
  message: string;
  analysis?: {
    status: "UNCHANGED" | "IMPROVED" | "WORSENED" | "NON_COMPARABLE";
    score: number; // 0-100 (0 = Safe, 100 = Critical)
    reasoning: string;
    advice: string;
  };
}

export async function compareLesionsWithGemini(
  oldUri: string,
  newUri: string,
  language: string = "en"
): Promise<ComparisonResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // ✅ FIX: Use the legacy function directly
    const oldB64 = await readAsStringAsync(oldUri, { encoding: "base64" });
    const newB64 = await readAsStringAsync(newUri, { encoding: "base64" });

    const prompt = `
      You are an expert dermatology AI assistant.
      I am providing two images of a skin lesion:
      - Image 1: Historical Baseline.
      - Image 2: New Scan (Today).

      Your task is to validate them and then track changes.

      ### STAGE 1: VALIDATION (Strict Gatekeeping)
      Analyze Image 2 (The new scan). Stop immediately if:
      1. It is NOT a skin lesion (e.g. random object, face, furniture). -> Code: "IRRELEVANT"
      2. It is too blurry, dark, or obscured by hair to analyze. -> Code: "POOR_QUALITY"

      ### STAGE 2: COMPARISON (Only if Valid)
      Compare Image 2 against Image 1. Ignore minor lighting/angle differences.
      Classify the evolution into one of four distinct categories:

      1. UNCHANGED (Neutral/Grey):
         - No meaningful biological change.
         - The lesion's size, shape, borders, and color are effectively identical.
         - Minor differences due to lighting or camera angle should be ignored.

      2. IMPROVED (Good/Green):
         - The lesion appears to be healing, fading, or shrinking.
         - It looks less inflamed or is resolving.

      3. WORSENED (Bad/Red):
         - The lesion looks more concerning.
         - It has grown in size, become darker, developed irregular borders, or asymmetry.
         - Any sign of evolution that suggests malignancy or aggressive growth.
      
      4. NON_COMPARABLE (Orange):
         - Both are skin lesions, but they cannot be reliably compared.
         - Examples: Different body parts/lesions, extreme zoom differences, completely different angles, or one is a close-up dermoscopy and the other is a far-away macro shot.
         - Return a score of 0 for this case.

      IMPORTANT: Provide the "message", "reasoning", and "advice" values in ${language === "tr" ? "Turkish" : "English"}.

      ### OUTPUT FORMAT (JSON ONLY)
      Return a single JSON object. 
      If validation fails, set "valid": false.
      If validation passes, set "valid": true and fill "analysis".

      Example Success (Improved):
      {
        "valid": true,
        "code": "SUCCESS",
        "message": "Comparison complete.",
        "analysis": {
          "status": "IMPROVED", 
          "score": 10,
          "reasoning": "The lesion has significantly faded in color and reduced in diameter compared to the baseline.",
          "advice": "The healing process looks good. Continue normal skin care."
        }
      }

      Example Success (Unchanged):
      {
        "valid": true,
        "code": "SUCCESS",
        "message": "Comparison complete.",
        "analysis": {
          "status": "UNCHANGED", 
          "score": 0,
          "reasoning": "The borders and pigmentation remain identical. No biological evolution detected.",
          "advice": "Continue routine monitoring."
        }
      }
      
      Example Failure:
      {
        "valid": false,
        "code": "IRRELEVANT",
        "message": "The new image does not appear to be a skin lesion."
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: oldB64, mimeType: "image/jpeg" } },
      { inlineData: { data: newB64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    console.log("Gemini Raw Response:", text);

    const parsed = JSON.parse(text) as ComparisonResult;

    // ✅ NORMALIZATION: Ensure status is standard
    if (parsed.analysis) {
      const s = parsed.analysis.status.toUpperCase();
      if (s === "PROGRESSION" || s === "DETERIORATED" || s === "EVOLVED") {
        parsed.analysis.status = "WORSENED";
      } else if (
        !["UNCHANGED", "IMPROVED", "WORSENED", "NON_COMPARABLE"].includes(s)
      ) {
        // Fallback for weird AI outputs
        parsed.analysis.status = "WORSENED";
      } else {
        parsed.analysis.status = s as any;
      }
    }

    return parsed;
  } catch (error) {
    console.error("Gemini Comparison Error:", error);
    return {
      valid: false,
      code: "POOR_QUALITY",
      message: "AI could not process the request. Please try again.",
    };
  }
}
