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
        diagnosis TEXT,
        confidence REAL,
        date TEXT,
        createdAt TEXT,
        firebaseId TEXT,             
        isSynced INTEGER DEFAULT 0,  
        isDeleted INTEGER DEFAULT 0,
        chatHistory TEXT
      );`
    );

    db.execSync(
      `CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        age TEXT, gender TEXT, hairColor TEXT, eyeColor TEXT, skinTone TEXT,
        sunReaction TEXT, freckling TEXT, workEnvironment TEXT, climate TEXT, ancestry TEXT,
        personalHistory TEXT, familyHistory TEXT, childhoodSunburns TEXT, tanningBeds TEXT,
        moleCount TEXT, uglyDuckling TEXT, recentChanges TEXT, sunscreen TEXT, protection TEXT, checkups TEXT,
        updatedAt TEXT
      );`
    );


    db.execSync(
      `CREATE TABLE IF NOT EXISTS comparisons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parentLesionId INTEGER NOT NULL,  -- Links to the original "Baseline" lesion
        oldImageUri TEXT,
        newImageUri TEXT,
        status TEXT,        -- "STABLE", "EVOLVING", "CONCERNING"
        score INTEGER,      -- 0-100
        reasoning TEXT,
        advice TEXT,
        date TEXT,
        createdAt TEXT,
        FOREIGN KEY(parentLesionId) REFERENCES lesions(id) ON DELETE CASCADE
      );`
    );
    
    console.log("✅ Comparison table ready.");

    console.log("✅ Database tables (Lesions & Profile) ready.");
  } catch (error) {
    console.error("❌ Error creating lesions table:", error);
  }
}