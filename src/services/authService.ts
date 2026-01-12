import auth, { sendPasswordResetEmail } from "@react-native-firebase/auth";
import { AUTH, DB } from "./Firebase";

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
export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    // 1. Create User
    const userCredential = await AUTH.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // 2. Update Profile & Create Firestore Doc
    if (user) {
      await user.updateProfile({ displayName: name });

      // ✅ Create User Document in Firestore
      await DB.collection("users").doc(user.uid).set({
        displayName: name,
        email: email,
        createdAt: new Date().toISOString(),
        role: "user",
        synced: true,
      });

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

  // ✅ Create Firestore Doc for New Google Users
  if (result.additionalUserInfo?.isNewUser && result.user) {
    await DB.collection("users")
      .doc(result.user.uid)
      .set({
        displayName: result.user.displayName || "Google User",
        email: result.user.email,
        createdAt: new Date().toISOString(),
        role: "user",
        authMethod: "google",
      });
  }

  return result.user;
};

export const sendPasswordReset = async (email: string) => {
  try {
    // 2. Pass the AUTH instance as the first argument
    await sendPasswordResetEmail(AUTH, email);
    return true;
  } catch (error) {
    console.error("Password Reset Error:", error);
    throw error;
  }
};
