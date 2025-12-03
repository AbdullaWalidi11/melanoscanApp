import { 
  getUnsyncedLesions, 
  markLesionAsSynced, 
  insertOrUpdateFromCloud,
  getDeletedPendingSync,
  hardDeleteLesion
} from "../database/queries";
import { AUTH, DB, STORAGE } from "./Firebase";

// Helper: Upload Image
async function uploadImageToStorage(localUri: string, userId: string): Promise<string | null> {
  try {
    if (!localUri) return null;
    // Don't upload if it's already a cloud URL
    if (localUri.startsWith('http')) return localUri;

    const filename = localUri.split('/').pop();
    const storageRef = STORAGE.ref(`users/${userId}/lesions/${filename}`);
    await storageRef.putFile(localUri);
    return await storageRef.getDownloadURL();
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

// 1. PUSH (Local -> Cloud)
export async function syncLocalToCloud() {
  const user = AUTH.currentUser;
  if (!user || user.isAnonymous) return;

  console.log("⬆️ Starting PUSH Sync...");
  
  // A. Upload New Scans
  const unsyncedItems = await getUnsyncedLesions();
  for (const lesion of unsyncedItems) {
    try {
      let firestoreImageUri = lesion.imageUri;
      if (lesion.imageUri && !lesion.imageUri.startsWith('http')) {
        firestoreImageUri = (await uploadImageToStorage(lesion.imageUri, user.uid)) || "";
      }

      const docRef = await DB.collection('users').doc(user.uid).collection('lesions').add({
        region: lesion.region,
        description: lesion.description || "",
        imageUri: firestoreImageUri,
        confidence: lesion.confidence,
        resultLabel: lesion.resultLabel,
        date: lesion.date,
        createdAt: lesion.createdAt,
        syncedAt: new Date().toISOString(),
        isDeleted: false 
      });

      await markLesionAsSynced(Number(lesion.id), docRef.id);
      console.log(`✅ Uploaded: ${lesion.id}`);
    } catch (e) {
      console.error(`Failed to upload ${lesion.id}`, e);
    }
  }

  // B. Sync Deletions (Scenario 4)
  const deletedItems = await getDeletedPendingSync();
  for (const item of deletedItems) {
    try {
      console.log(`🗑️ Deleting from Cloud: ${item.firebaseId}`);
      // 1. Delete from Firestore
      await DB.collection('users').doc(user.uid).collection('lesions').doc(item.firebaseId).delete();
      // 2. Hard Delete from SQLite now that cloud is consistent
      await hardDeleteLesion(item.id);
    } catch (e) {
      console.error(`Failed to delete cloud doc ${item.firebaseId}`, e);
    }
  }
}

// 2. PULL (Cloud -> Local) - Scenario 1 & 3
export async function syncCloudToLocal() {
  const user = AUTH.currentUser;
  if (!user || user.isAnonymous) return;

  console.log("⬇️ Starting PULL Sync...");

  try {
    const snapshot = await DB.collection('users').doc(user.uid).collection('lesions')
        .where("isDeleted", "==", false) // Don't pull deleted stuff
        .get();

    if (snapshot.empty) {
        console.log("☁️ No data in cloud.");
        return;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Insert into SQLite (wrapper handles duplicates)
      await insertOrUpdateFromCloud({
        id: doc.id, // Firestore ID
        ...data
      });
    }
    console.log("⬇️ Pull Complete.");
  } catch (e) {
    console.error("Pull Sync Failed:", e);
  }
}

// 3. FULL SYNC (Wrapper)
export async function runFullSync() {
  console.log("🔄 Running Full Sync...");
  await syncLocalToCloud(); // Push first (preserve local changes)
  await syncCloudToLocal(); // Then pull (get other device changes)
  console.log("✅ Full Sync Done.");
}