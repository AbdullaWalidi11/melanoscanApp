import { getDB } from "./db";
import { SurveyData } from "../context/SurveyContext";
import { Alert } from "react-native";
// ✅ Added 'export' here so we can import it in HomeScreen
export interface Scan {
  id: string;
  imageUri: string;
  description?: string;
  date: string;
  resultLabel: string;
  diagnosis?: string;
  confidence: number;
  createdAt: string;
  region: string;
  chatHistory?: string | null;
}

export async function saveLesion({
  region,
  description,
  imageUri,
  resultLabel,
  diagnosis,
  confidence,
}: {
  region: string;
  description?: string;
  imageUri?: string | null;
  resultLabel?: string;
  diagnosis?: string;
  confidence?: number;
}) {
  const db = getDB();
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const createdAt = now.toISOString();

  try {
    const result = await db.runAsync(
      `INSERT INTO lesions (region, description, imageUri, resultLabel, diagnosis, confidence, date, createdAt, isSynced, isDeleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        region,
        description || null,
        imageUri || null,
        resultLabel || null,
        diagnosis || null,
        confidence || null,
        dateString,
        createdAt,
      ]
    );
    return { success: true, id: result.lastInsertRowId };
  } catch (error: any) {
    Alert.alert("Database Error", error.toString());
    console.error("Error saving lesion:", error);
    throw error;
  }
}

// New function to get lesions by region

export async function getLesionsByRegion(region: string) {
  const db = getDB();
  // Added: AND isDeleted = 0
  const sql = `SELECT * FROM lesions WHERE region = ? AND isDeleted = 0 ORDER BY date DESC;`;
  const params: (string | number | null)[] = [region];

  try {
    const result = await db.getAllAsync(sql, params);
    return result;
  } catch (error) {
    console.error("Error getting lesions:", error);
    throw error;
  }
}

// New function to count lesions by region

export async function countLesionsByRegion(region: string): Promise<number> {
  const db = getDB();
  // Added: AND isDeleted = 0
  const sql = `SELECT COUNT(*) as count FROM lesions WHERE region = ? AND isDeleted = 0;`;
  const params: (string | number | null)[] = [region];

  try {
    const result = await db.getFirstAsync(sql, params);
    const count = (result as { count: number }).count;
    return count;
  } catch (error) {
    console.error("Error counting lesions:", error);
    throw error;
  }
}

// New function to delete a lesion by id

export async function deleteLesionById(id: number) {
  const db = getDB();

  try {
    // 1. Check if the lesion is already synced
    const lesion = await db.getFirstAsync<{ isSynced: number }>(
      `SELECT isSynced FROM lesions WHERE id = ?`,
      [id]
    );

    if (!lesion) return; // Lesion not found

    if (lesion.isSynced === 1) {
      // SCENARIO A: It exists in Firebase.
      // We perform a "Soft Delete". We mark it as deleted and unsynced.
      // The background sync will see this later and delete it from Firebase.
      console.log(`Soft deleting lesion ${id} (queued for Firebase deletion)`);
      await db.runAsync(
        `UPDATE lesions SET isDeleted = 1, isSynced = 0 WHERE id = ?`,
        [id]
      );
    } else {
      // SCENARIO B: It only exists locally.
      // We can safely "Hard Delete" it because the cloud doesn't know about it.
      console.log(`Hard deleting lesion ${id} (local only)`);
      await db.runAsync(`DELETE FROM lesions WHERE id = ?`, [id]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting lesion:", error);
    throw error;
  }
}

// New function to get the last three scans
export async function getLastThreeScans(): Promise<Scan[]> {
  const db = getDB();
  // Added: WHERE isDeleted = 0
  return await db.getAllAsync(
    `SELECT * FROM lesions WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT 3;`
  );
}
// New function to mark a lesion as synced

export async function markLesionAsSynced(localId: number, firebaseId: string) {
  const db = getDB();
  console.log(`Marking lesion ${localId} as synced with firebaseId: ${firebaseId}`);
  
  try {
    await db.runAsync(
      `UPDATE lesions 
       SET isSynced = 1, firebaseId = ? 
       WHERE id = ?`,
      [firebaseId, localId]
    );
  } catch (error) {
    console.error("Error marking lesion as synced:", error);
  }
}

// New function to get unsynced lesions

export async function getUnsyncedLesions(): Promise<Scan[]>  {
  const db = getDB();
  try {
    // Get all active (not deleted) lesions that haven't been synced yet
    const results = await db.getAllAsync(
      `SELECT * FROM lesions WHERE isSynced = 0 AND isDeleted = 0`
    );
    return results as Scan[];
  } catch (error) {
    console.error("Error getting unsynced lesions:", error);
    return [];
  }
}

// ... (Your existing code)

// NEW: Scenario 1 & 3 (Pull from Cloud)
// Inserts a record from Firebase into SQLite, or updates it if it exists
export async function insertOrUpdateFromCloud(data: any) {
  const db = getDB();
  try {
    // 1. Check if this firebaseId already exists locally
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM lesions WHERE firebaseId = ?`,
      [data.id] // data.id is the Firestore Document ID
    );

    if (existing) {
      // Optional: Update local if cloud is newer (Conflict Resolution)
      console.log(`Skipping duplicate cloud item: ${data.id}`);
      return;
    }

    // 2. Insert new record
    await db.runAsync(
      `INSERT INTO lesions 
       (region, description, imageUri, resultLabel, diagnosis, confidence, date, createdAt, firebaseId, isSynced, isDeleted, chatHistory)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
      [
        data.region,
        data.description,
        data.imageUri,
        data.resultLabel,
        data.diagnosis || null,
        data.confidence,
        data.date,
        data.createdAt,
        data.id, // Save the Firebase ID so we don't duplicate later
        data.chatHistory || null,
      ]
    );
    console.log(`📥 Downloaded scan from cloud: ${data.id}`);
  } catch (error) {
    console.error("Error inserting from cloud:", error);
  }
}

// NEW: Scenario 4 (Sync Deletions)
// Get items that were deleted offline (isDeleted=1) but Firebase doesn't know yet (isSynced=0)
// Note: When we "Soft Delete", we set isSynced=0 so the sync service picks it up.
export async function getDeletedPendingSync(): Promise<{ id: number; firebaseId: string }[]> {
  const db = getDB();
  try {
    const results = await db.getAllAsync(
      `SELECT id, firebaseId FROM lesions WHERE isDeleted = 1 AND isSynced = 0 AND firebaseId IS NOT NULL`
    );
    return results as { id: number; firebaseId: string }[];
  } catch (error) {
    console.error("Error getting pending deletions:", error);
    return [];
  }
}

// NEW: Scenario 4 (Cleanup)
// Hard delete a row after we confirmed Firebase deleted it too
export async function hardDeleteLesion(id: number) {
  const db = getDB();
  try {
    await db.runAsync(`DELETE FROM lesions WHERE id = ?`, [id]);
  } catch (error) {
    console.error("Error hard deleting lesion:", error);
  }
}

// NEW: Scenario 5 (Logout Wipe)
export async function clearDatabase() {
  const db = getDB();
  try {
    console.log("⚠️ Wiping local database (Logout)...");
    await db.runAsync(`DELETE FROM lesions`); 
    // Or drop table if you prefer: await db.runAsync(`DROP TABLE IF EXISTS lesions`);
  } catch (error) {
    console.error("Error clearing DB:", error);
  }
}

//  Save User Profile 
export async function saveUserProfile(data: SurveyData) {
  const db = getDB();
  const now = new Date().toISOString();

  try {
    // We force ID=1 so it overwrites any previous survey data
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profile (
        id, age, gender, hairColor, eyeColor, skinTone,
        sunReaction, freckling, workEnvironment, climate, ancestry,
        personalHistory, familyHistory, childhoodSunburns, tanningBeds,
        moleCount, uglyDuckling, recentChanges, sunscreen, protection, checkups,
        updatedAt
      ) VALUES (
        1, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?,
        ?
      )`,
      [
        data.age, data.gender, data.hairColor, data.eyeColor, data.skinTone,
        data.sunReaction, data.freckling, data.workEnvironment, data.climate, data.ancestry,
        data.personalHistory, data.familyHistory, data.childhoodSunburns, data.tanningBeds,
        data.moleCount, data.uglyDuckling, data.recentChanges, data.sunscreen, data.protection, data.checkups,
        now
      ]
    );
    console.log("✅ User Risk Profile saved to SQLite.");
  } catch (error) {
    console.error("Error saving profile:", error);
    throw error;
  }
}

// Get User Profile (For AI Context) 
export async function getUserProfile(): Promise<SurveyData | null> {
  const db = getDB();
  try {
    const result = await db.getFirstAsync(`SELECT * FROM user_profile WHERE id = 1`);
    return result as SurveyData;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// Add to src/database/queries.ts

export async function updateLesion(id: number, region: string, description: string) {
  const db = getDB();
  try {
    await db.runAsync(
      `UPDATE lesions SET region = ?, description = ? WHERE id = ?`,
      [region, description, id]
    );
    console.log(`Updated lesion ${id} with region: ${region}`);
  } catch (error) {
    console.error("Error updating lesion:", error);
    throw error;
  }
}

// ✅ NEW: Save Chat History
export async function saveChatHistory(lesionId: number, messages: any[]) {
  const db = getDB();
  try {
    const jsonString = JSON.stringify(messages);
    
    // We update chatHistory AND set isSynced=0 so it uploads to cloud later!
    await db.runAsync(
      `UPDATE lesions SET chatHistory = ?, isSynced = 0 WHERE id = ?`,
      [jsonString, lesionId]
    );
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
}

// ... existing imports

// ✅ MODIFIED: Only count scans that have a real region (User explicitly saved them)
export async function countTotalScans(): Promise<number> {
  const db = getDB();
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM lesions WHERE isDeleted = 0 AND region != 'Unspecified'`
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Error counting scans:", error);
    return 0;
  }
}

export async function saveComparisonLog(data: {
  parentLesionId: number;
  oldImageUri: string;
  newImageUri: string;
  status: string;
  score: number;
  reasoning: string;
  advice: string;
}) {
  const db = getDB();
  const now = new Date();
  
  try {
    await db.runAsync(
      `INSERT INTO comparisons (parentLesionId, oldImageUri, newImageUri, status, score, reasoning, advice, date, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.parentLesionId,
        data.oldImageUri,
        data.newImageUri,
        data.status,
        data.score,
        data.reasoning,
        data.advice,
        now.toLocaleDateString(),
        now.toISOString()
      ]
    );
    console.log("✅ Comparison log saved.");
  } catch (error) {
    console.error("Error saving comparison log:", error);
    throw error;
  }
}

export async function getComparisonLogs(parentLesionId: number) {
  const db = getDB();
  return await db.getAllAsync(
    `SELECT * FROM comparisons WHERE parentLesionId = ? ORDER BY createdAt DESC`,
    [parentLesionId]
  );
}