import auth from '@react-native-firebase/auth'; 
import { AUTH } from './Firebase'; 

// ✅ Guest Sign-In
export const guestSignIn = async () => {
  const result = await AUTH.signInAnonymously();
  return result.user;
};

// ✅ Email Sign-In
export const emailSignIn = async (email: string, password: string) => {
  const result = await AUTH.signInWithEmailAndPassword(email, password);
  return result.user;
};

// ✅ Email Sign-Up 
export const signUpWithEmail = async (name: string, email: string, password: string) => {
  try {
    // 1. Create User
    const userCredential = await AUTH.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // 2. Update Profile & Send Verification
    if (user) {
      await user.updateProfile({ displayName: name });
      await user.sendEmailVerification();
    }

    return { user };
  } catch (error: any) {
    console.error("Sign Up error:", error);
    throw error; 
  }
};

// ✅ Google Sign-In 
export const googleSignIn = async (idToken: string) => {
  // Native SDK: Access GoogleAuthProvider from the main 'auth' module
  const credential = auth.GoogleAuthProvider.credential(idToken);
  
  const result = await AUTH.signInWithCredential(credential);
  return result.user;
};