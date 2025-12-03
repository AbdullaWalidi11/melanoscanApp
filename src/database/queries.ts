import { getDB } from "./db";

// ✅ Added 'export' here so we can import it in HomeScreen
export interface Scan {
  id: string;
  imageUri: string;
  description?: string;
  date: string;
  resultLabel: string;
  confidence: number;
  createdAt: string;
  region: string;
}

export async function saveLesion({
  region,
  description,
  imageUri,
  resultLabel,
  confidence,
}: {
  region: string;
  description?: string;
  imageUri?: string | null;
  resultLabel?: string;
  confidence?: number;
}) {
  const db = getDB();
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const createdAt = now.toISOString();

  try {
    const result = await db.runAsync(
      `INSERT INTO lesions (region, description, imageUri, resultLabel, confidence, date, createdAt, isSynced, isDeleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        region,
        description || null,
        imageUri || null,
        resultLabel || null,
        confidence || null,
        dateString,
        createdAt,
      ]
    );
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
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