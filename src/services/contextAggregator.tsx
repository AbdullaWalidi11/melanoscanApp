// ✅ FIX 1: Import from the 'legacy' path to avoid the "Method will throw" error
import * as FileSystem from 'expo-file-system/legacy';
import { getUserProfile } from '../database/queries';
import { getDB } from '../database/db';

interface ContextPackage {
  systemInstruction: string;
  base64Image: string | null;
}

export const generateContextPrompt = async (lesionId: number): Promise<ContextPackage | null> => {
  const db = getDB();

  try {
    // 1. Fetch the Specific Lesion
    const lesion = await db.getFirstAsync<any>(
      `SELECT * FROM lesions WHERE id = ?`,
      [lesionId]
    );

    if (!lesion) {
      console.error("Context Error: Lesion not found");
      return null;
    }

    // 2. Fetch the User Profile
    const profile = await getUserProfile();

    // 3. Smart Image Loading (Local vs Remote)
    let base64Image = null;
    if (lesion.imageUri) {
      try {
        const uri = lesion.imageUri;

        if (uri.startsWith('http') || uri.startsWith('https')) {
          // CASE A: Remote URL (Firebase)
          // We must download it to a temp file first
          
          // ✅ FIX: Use legacy FileSystem.cacheDirectory
          const tempUri = `${FileSystem.cacheDirectory}temp_ai_image.jpg`;
          
          // ✅ FIX: Use legacy FileSystem.downloadAsync
          await FileSystem.downloadAsync(uri, tempUri);
          
          // Now read the local temp file
          base64Image = await FileSystem.readAsStringAsync(tempUri, {
            encoding: 'base64', // Use string 'base64' instead of Enum
          });
        } else {
          // CASE B: Local File (freshly scanned)
          base64Image = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64', 
          });
        }
      } catch (err) {
        console.warn("Context Warning: Could not process image for AI", err);
      }
    }

    // 4. Construct the "System Instruction"
    // UPDATED: Now includes ALL 20 data points from the survey
    const riskProfile = profile ? `
    [Patient Demographics]
    - Age: ${profile.age || "N/A"}
    - Gender: ${profile.gender || "N/A"}
    - Phenotype: ${profile.hairColor || "?"} Hair, ${profile.eyeColor || "?"} Eyes
    - Skin Tone: ${profile.skinTone || "Unknown"}
    - Ancestry: ${profile.ancestry || "Unknown"}

    [Sun Sensitivity & Environment]
    - Sun Reaction: ${profile.sunReaction || "Unknown"}
    - Freckling: ${profile.freckling || "Unknown"}
    - Climate: ${profile.climate || "Unknown"}
    - Work Environment: ${profile.workEnvironment || "Unknown"}

    [Medical History & Risk Factors]
    - Personal History of Skin Cancer: ${profile.personalHistory || "No"}
    - Family History of Melanoma: ${profile.familyHistory || "No"}
    - History of Blistering Sunburns: ${profile.childhoodSunburns || "Unknown"}
    - Tanning Bed Usage: ${profile.tanningBeds || "Unknown"}

    [Current Observations]
    - Total Mole Count Est.: ${profile.moleCount || "Unknown"}
    - "Ugly Duckling" Sign Present: ${profile.uglyDuckling || "No"}
    - Recent Changes Noticed: ${profile.recentChanges || "None"}

    [Habits]
    - Sunscreen Usage: ${profile.sunscreen || "Unknown"}
    - Protective Clothing: ${profile.protection || "Unknown"}
    - Professional Checkups: ${profile.checkups || "Unknown"}
    ` : "No patient profile data available. Treat as average risk.";

    const scanData = `
    - Region: ${lesion.region}
    - AI Analysis: ${lesion.resultLabel || "Pending"}
    - Confidence: ${Math.round((lesion.confidence || 0) * 100)}%
    - Diagnosis: ${lesion.diagnosis || "Not provided"}
    - Date Scanned: ${new Date(lesion.createdAt).toLocaleDateString()}
    `;

    const systemInstruction = `
    You are MelanoScan AI, a specialized dermatology assistant.
    
    Current Patient Context:
    ${riskProfile}

    Current Scan Context (See attached image):
    ${scanData}

    Your Goal:
    Answer the user's questions about this specific lesion based on the visual (scanData) evidence and their risk profile.
    
    Rules:
    1. Be empathetic but objective.
    2. If the risk is High or the patient has a history of cancer, strongly advise a professional checkup.
    3. Do NOT provide a definitive medical diagnosis (e.g., do not say "You have cancer"). Say "This shows signs of..."
    4. Keep answers concise and helpful.
    `;

    return {
      systemInstruction,
      base64Image
    };

  } catch (error) {
    console.error("Error generating context:", error);
    return null;
  }
};