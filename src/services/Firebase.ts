import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';


GoogleSignin.configure({
  // Paste the WEB CLIENT ID from Firebase Console -> Authentication -> Google
  webClientId: "1071482011625-i8o1umqufv8a7n9sag853gmk26kuju8s.apps.googleusercontent.com",
});

export const signInWithGoogle = async () => {
  try {
    // A. Check for Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // B. Sign In (v13+ returns a response object)
    const response = await GoogleSignin.signIn();
    
    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found');
    }

    // ✅ 2. Use Modular Provider
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // ✅ 3. Use Modular Sign-In Function
    // Old way: return auth().signInWithCredential(googleCredential);
    // New way: Pass the auth instance as the first argument
    return signInWithCredential(auth(), googleCredential);
    
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Initialize services
// We export instances so you can just import { AUTH, DB, STORAGE } elsewhere
export const FIREBASE_APP = firebase.app();
export const AUTH = auth();
export const DB = firestore();
export const STORAGE = storage();

console.log("✅ Firebase Native SDK initialized successfully!");