import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Missing API Key");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const chatWithGemini = async (
  base64Image: string,
  userDescription?: string
) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    // Clean base64 just in case
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      Analyze this skin lesion. Description: "${userDescription || "None"}".
      Return JSON:
      {
        "riskLevel": "Low" | "Medium" | "High",
        "observation": "Visual description",
        "recommendation": "Action steps"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    return result.response.text();
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};
