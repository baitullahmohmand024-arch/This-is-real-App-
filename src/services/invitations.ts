import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Invitation, UserProfile } from '../types';

// Generate a cryptographically secure random token
export const generateSecureToken = (): string => {
  const array = new Uint8Array(24);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const createInvitation = async (user: UserProfile): Promise<{ invitation: Invitation; inviteUrl: string }> => {
  try {
    const invitationsRef = collection(db, 'invitations');
    const newDocRef = doc(invitationsRef);
    const token = generateSecureToken();
    const now = new Date();
    // Default expiration: 48 hours
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const invitation: Invitation = {
      id: newDocRef.id,
      token,
      createdBy: user.uid,
      creatorName: user.name,
      creatorPhotoURL: user.photoURL || '',
      creatorEmail: user.email,
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt,
    };

    await setDoc(newDocRef, invitation);

    const baseUrl = window.location.origin + window.location.pathname;
    const inviteUrl = `${baseUrl}?invite=${token}`;

    return { invitation, inviteUrl };
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    throw new Error('Could not create invitation. Please try again.');
  }
};

export interface ValidateInviteResult {
  isValid: boolean;
  invitation: Invitation | null;
  errorMessage?: string;
}

export const validateInvitationToken = async (
  token: string,
  currentUid?: string
): Promise<ValidateInviteResult> => {
  try {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { isValid: false, invitation: null, errorMessage: 'Invalid invitation format.' };
    }

    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('token', '==', cleanToken), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        isValid: false,
        invitation: null,
        errorMessage: 'Invitation not found. Please check the link or request a new one.'
      };
    }

    const inviteData = snapshot.docs[0].data() as Invitation;
    const inviteId = snapshot.docs[0].id;
    inviteData.id = inviteId;

    // Check if user is trying to connect with themselves
    if (currentUid && inviteData.createdBy === currentUid) {
      return {
        isValid: false,
        invitation: inviteData,
        errorMessage: 'This is your own invitation link. Please share it with someone else.'
      };
    }

    // Check expiration
    const expiryTime = new Date(inviteData.expiresAt).getTime();
    if (Date.now() > expiryTime) {
      return {
        isValid: false,
        invitation: inviteData,
        errorMessage: 'This invitation has expired. Ask your friend to create a new invitation.'
      };
    }

    // Check if already used
    if (inviteData.status === 'used') {
      return {
        isValid: false,
        invitation: inviteData,
        errorMessage: 'This invitation has already been used. Please ask for a new link.'
      };
    }

    return {
      isValid: true,
      invitation: inviteData
    };
  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return {
      isValid: false,
      invitation: null,
      errorMessage: 'Unable to validate invitation. Please check your connection.'
    };
  }
};

export const markInvitationAsUsed = async (invitationId: string, usedByUid: string) => {
  try {
    const inviteRef = doc(db, 'invitations', invitationId);
    await updateDoc(inviteRef, {
      status: 'used',
      usedBy: usedByUid,
      usedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking invitation as used:', error);
  }
};
