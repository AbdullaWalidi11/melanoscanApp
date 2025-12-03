import { getDB } from "./db";

export function createLesionsTable() {
  const db = getDB();

  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS lesions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region TEXT NOT NULL,
        description TEXT,
        imageUri TEXT,
        resultLabel TEXT,
        confidence REAL,
        date TEXT,
        createdAt TEXT,
        firebaseId TEXT,             
        isSynced INTEGER DEFAULT 0,  
        isDeleted INTEGER DEFAULT 0  
      );`
    );
    console.log("✅ Lesions table ready.");
  } catch (error) {
    console.error("❌ Error creating lesions table:", error);
  }
}