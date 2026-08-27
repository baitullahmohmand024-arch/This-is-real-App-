import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Conversation, Message, MessageType, UserProfile, ParticipantInfo } from '../types';

// Deterministic conversation ID generator to prevent duplicate conversations
export const getDeterministicConversationId = (uid1: string, uid2: string): string => {
  return uid1 < uid2 ? `conv_${uid1}_${uid2}` : `conv_${uid2}_${uid1}`;
};

export const getOrCreateConversation = async (
  currentUser: UserProfile,
  partnerUser: { uid: string; name: string; photoURL: string; email?: string }
): Promise<Conversation> => {
  const convId = getDeterministicConversationId(currentUser.uid, partnerUser.uid);
  const convRef = doc(db, 'conversations', convId);
  const snap = await getDoc(convRef);

  const now = new Date().toISOString();

  const partnerInfo: ParticipantInfo = {
    uid: partnerUser.uid,
    name: partnerUser.name || 'Friend',
    photoURL: partnerUser.photoURL || '',
    email: partnerUser.email,
  };

  const currentInfo: ParticipantInfo = {
    uid: currentUser.uid,
    name: currentUser.name,
    photoURL: currentUser.photoURL || '',
    email: currentUser.email,
  };

  if (snap.exists()) {
    const existing = snap.data() as Conversation;
    // Update participant details with latest names/photos
    await updateDoc(convRef, {
      [`participantDetails.${currentUser.uid}`]: currentInfo,
      [`participantDetails.${partnerUser.uid}`]: partnerInfo,
      updatedAt: now,
    });
    return {
      ...existing,
      id: convId,
      participantDetails: {
        ...existing.participantDetails,
        [currentUser.uid]: currentInfo,
        [partnerUser.uid]: partnerInfo,
      }
    };
  }

  // Create new conversation
  const newConversation: Conversation = {
    id: convId,
    participants: [currentUser.uid, partnerUser.uid],
    participantDetails: {
      [currentUser.uid]: currentInfo,
      [partnerUser.uid]: partnerInfo,
    },
    lastMessage: 'Conversation started',
    lastMessageType: 'text',
    lastMessageAt: now,
    lastMessageSenderId: currentUser.uid,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(convRef, newConversation);
  return newConversation;
};

// Listen to all conversations for a user
export const subscribeToConversations = (
  uid: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError?: (err: any) => void
) => {
  const convsRef = collection(db, 'conversations');
  const q = query(convsRef, where('participants', 'array-contains', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const convs: Conversation[] = snapshot.docs.map((d) => {
        const data = d.data() as Conversation;
        return {
          ...data,
          id: d.id,
        };
      });

      // Sort in-memory by updatedAt descending
      convs.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      onUpdate(convs);
    },
    (err) => {
      console.error('Conversations listener error:', err);
      if (onError) onError(err);
    }
  );
};

// Listen to real-time messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  onUpdate: (messages: Message[]) => void,
  onError?: (err: any) => void
) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((d) => {
        const data = d.data() as Message;
        return {
          ...data,
          id: d.id,
        };
      });
      onUpdate(messages);
    },
    (err) => {
      console.error('Messages listener error:', err);
      if (onError) onError(err);
    }
  );
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  sender: UserProfile,
  messageData: {
    text?: string;
    type: MessageType;
    mediaUrl?: string;
    mediaDuration?: number;
    mediaSize?: number;
  }
): Promise<string> => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const newMsgRef = doc(messagesRef);
  const now = new Date().toISOString();

  let previewText = messageData.text || '';
  if (messageData.type === 'image') previewText = '📷 Photo';
  if (messageData.type === 'video') previewText = '🎥 Video';
  if (messageData.type === 'audio') previewText = '🎤 Voice note';

  const message: Message = {
    id: newMsgRef.id,
    conversationId,
    senderId: sender.uid,
    senderName: sender.name,
    senderPhotoURL: sender.photoURL || '',
    text: messageData.text || '',
    type: messageData.type,
    mediaUrl: messageData.mediaUrl,
    mediaDuration: messageData.mediaDuration,
    mediaSize: messageData.mediaSize,
    status: 'delivered',
    createdAt: now,
  };

  await setDoc(newMsgRef, message);

  // Update conversation last message summary
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessage: previewText,
    lastMessageType: messageData.type,
    lastMessageAt: now,
    lastMessageSenderId: sender.uid,
    updatedAt: now,
  });

  return newMsgRef.id;
};

// Soft delete or remove message
export const deleteMessage = async (conversationId: string, messageId: string) => {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, {
    deleted: true,
    text: 'This message was deleted',
    mediaUrl: null,
  });
};
