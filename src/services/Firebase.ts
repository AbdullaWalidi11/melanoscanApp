import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Initialize services
// We export instances so you can just import { AUTH, DB, STORAGE } elsewhere
export const FIREBASE_APP = firebase.app();
export const AUTH = auth();
export const DB = firestore();
export const STORAGE = storage();

console.log("✅ Firebase Native SDK initialized successfully!");