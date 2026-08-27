import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { UserProfile } from '../types';

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error during Google sign in:', error);
    // If popup was blocked or closed by user, throw friendly error
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup blocked by browser. Please allow popups or try again.');
    }
    throw new Error(error.message || 'Failed to authenticate with Google.');
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const saveUserProfile = async (
  uid: string,
  name: string,
  photoURL: string,
  email: string
): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  const snap = await getDoc(userDocRef);
  let profileData: UserProfile;

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    profileData = {
      ...existing,
      name,
      photoURL,
      email: email || existing.email,
      status: 'online',
      lastSeen: now,
      updatedAt: now,
    };
    await updateDoc(userDocRef, {
      name,
      photoURL,
      status: 'online',
      lastSeen: now,
      updatedAt: now,
    });
  } else {
    profileData = {
      uid,
      name,
      photoURL,
      email,
      status: 'online',
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userDocRef, profileData);
  }

  return profileData;
};

export const updateUserPresence = async (uid: string, status: 'online' | 'offline') => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const now = new Date().toISOString();
    await updateDoc(userDocRef, {
      status,
      lastSeen: now,
      updatedAt: now,
    });
  } catch (error) {
    // Fail silently for presence update if logged out
  }
};

export const signOutUser = async (uid?: string) => {
  if (uid) {
    await updateUserPresence(uid, 'offline');
  }
  await signOut(auth);
};
