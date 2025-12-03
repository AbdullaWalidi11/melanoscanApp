// FIX: Use relative path instead of alias to ensure it finds the file
import { getUnsyncedLesions, markLesionAsSynced, Scan } from "../database/queries";
import { AUTH, DB, STORAGE } from "./Firebase";

// Helper: Uploads a local file to Firebase Storage
async function uploadImageToStorage(localUri: string, userId: string): Promise<string> {
  try {
    const filename = localUri.split('/').pop(); // e.g., "image123.jpg"
    const storageRef = STORAGE.ref(`users/${userId}/lesions/${filename}`);
    
    // Native SDK can upload directly from the file path!
    await storageRef.putFile(localUri);
    
    // Get the public URL to save in Firestore
    const downloadUrl = await storageRef.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

// Main Function: Pushes all pending local data to the cloud
export async function syncLocalToCloud() {
  const user = AUTH.currentUser;
  
  // 1. Safety Check: Must be logged in to sync
  if (!user) {
    console.log("Skipping sync: User not logged in (Guest Mode)");
    return; 
  }

  // Check if user is Anonymous (Guest), usually we don't sync for guests unless they upgrade
  if (user.isAnonymous) {
     console.log("Skipping sync: User is Anonymous");
     return;
  }

  console.log("🔄 Starting Sync Process...");

  // 2. Get all "Guest Mode" scans that haven't been uploaded
  const unsyncedItems = await getUnsyncedLesions();

  if (unsyncedItems.length === 0) {
    console.log("✅ Nothing to sync.");
    return;
  }

  console.log(`Found ${unsyncedItems.length} items to upload.`);

  // 3. Loop through them and upload one by one
  for (const lesion of unsyncedItems) {
    try {
      console.log(`Uploading lesion ID: ${lesion.id}...`);

      let firestoreImageUri = null;

      // A. Upload Image (if it exists)
      if (lesion.imageUri) {
        firestoreImageUri = await uploadImageToStorage(lesion.imageUri, user.uid);
      }

      // B. Create Firestore Document
      const docRef = await DB.collection('users').doc(user.uid).collection('lesions').add({
        region: lesion.region,
        description: lesion.description || "",
        imageUri: firestoreImageUri, // Save the CLOUD URL
        confidence: lesion.confidence,
        resultLabel: lesion.resultLabel,
        date: lesion.date,
        createdAt: lesion.createdAt,
        syncedAt: new Date().toISOString(),
        isDeleted: false 
      });

      // C. Update SQLite
      // We tell the local DB: "This ID is now safe in cloud with ID: docRef.id"
      await markLesionAsSynced(Number(lesion.id), docRef.id);
      
      console.log(`✅ Synced lesion ${lesion.id} -> Firestore ID: ${docRef.id}`);

    } catch (error) {
      console.error(`❌ Failed to sync lesion ${lesion.id}:`, error);
      // We continue to the next item even if one fails
    }
  }
  
  console.log("🔄 Sync Process Complete.");
}