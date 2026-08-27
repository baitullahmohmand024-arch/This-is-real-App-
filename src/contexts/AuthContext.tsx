import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  getUserProfile,
  saveUserProfile,
  signOutUser,
  updateUserPresence
} from '../services/auth';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  pendingInviteToken: string | null;
  setPendingInviteToken: (token: string | null) => void;
  createOrUpdateProfile: (name: string, photoURL: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(() => {
    // Check URL parameters first
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      localStorage.setItem('pending_invite_token', invite);
      return invite;
    }
    return localStorage.getItem('pending_invite_token') || null;
  });

  // Keep track of pending invite in storage
  const handleSetPendingInviteToken = (token: string | null) => {
    setPendingInviteToken(token);
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    } else {
      localStorage.removeItem('pending_invite_token');
    }
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setProfileLoading(true);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          if (profile) {
            await updateUserPresence(user.uid, 'online');
          }
        } catch (err) {
          console.error('Error checking profile on auth change:', err);
        } finally {
          setProfileLoading(false);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update presence on window visibility/unload
  useEffect(() => {
    if (!currentUser?.uid || !userProfile) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresence(currentUser.uid, 'online');
      } else {
        updateUserPresence(currentUser.uid, 'offline');
      }
    };

    const handleBeforeUnload = () => {
      updateUserPresence(currentUser.uid, 'offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser?.uid, userProfile]);

  const createOrUpdateProfile = async (name: string, photoURL: string): Promise<UserProfile> => {
    if (!currentUser) throw new Error('Not authenticated');
    setProfileLoading(true);
    try {
      const email = currentUser.email || '';
      const profile = await saveUserProfile(currentUser.uid, name, photoURL, email);
      setUserProfile(profile);
      return profile;
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const profile = await getUserProfile(currentUser.uid);
    setUserProfile(profile);
  };

  const logout = async () => {
    if (currentUser?.uid) {
      await signOutUser(currentUser.uid);
    } else {
      await signOutUser();
    }
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        profileLoading,
        pendingInviteToken,
        setPendingInviteToken: handleSetPendingInviteToken,
        createOrUpdateProfile,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
