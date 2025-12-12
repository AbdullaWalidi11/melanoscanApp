import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ FIX: Import from 'legacy' to avoid runtime crash
import { readAsStringAsync } from 'expo-file-system/legacy';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface ComparisonResult {
  valid: boolean;
  code: "SUCCESS" | "IRRELEVANT" | "POOR_QUALITY";
  message: string;
  analysis?: {
    status: "STABLE" | "EVOLVING" | "CONCERNING";
    score: number; // 0-100
    reasoning: string;
    advice: string;
  };
}

export async function compareLesionsWithGemini(oldUri: string, newUri: string): Promise<ComparisonResult> {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { responseMimeType: "application/json" }
    });

    // ✅ FIX: Use the legacy function directly
    const oldB64 = await readAsStringAsync(oldUri, { encoding: 'base64' });
    const newB64 = await readAsStringAsync(newUri, { encoding: 'base64' });

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
      Compare Image 2 against Image 1. Ignore minor lighting/angle differences. Focus on biological changes:
      - Size (relative to skin texture)
      - Shape/Border irregularity
      - Color evolution
      - Elevation/Texture

      ### OUTPUT FORMAT (JSON ONLY)
      Return a single JSON object. 
      If validation fails, set "valid": false.
      If validation passes, set "valid": true and fill "analysis".

      Example Success:
      {
        "valid": true,
        "code": "SUCCESS",
        "message": "Comparison complete.",
        "analysis": {
          "status": "STABLE", 
          "score": 10,
          "reasoning": "The borders and pigmentation remain identical. Slight difference in lighting but no biological change.",
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
      { inlineData: { data: newB64, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    console.log("Gemini Raw Response:", text);

    return JSON.parse(text) as ComparisonResult;

  } catch (error) {
    console.error("Gemini Comparison Error:", error);
    return {
        valid: false,
        code: "POOR_QUALITY",
        message: "AI could not process the request. Please try again."
    };
  }
}