export interface UserProfile {
  uid: string;
  name: string;
  photoURL: string;
  email: string;
  status: 'online' | 'offline';
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  token: string;
  createdBy: string;
  creatorName: string;
  creatorPhotoURL: string;
  creatorEmail?: string;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
  expiresAt: string;
  usedBy?: string;
  usedAt?: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
  mediaDuration?: number; // In seconds for voice notes/videos
  mediaSize?: number;
  status: MessageStatus;
  deleted?: boolean;
  createdAt: string;
}

export interface ParticipantInfo {
  uid: string;
  name: string;
  photoURL: string;
  email?: string;
  status?: 'online' | 'offline';
  lastSeen?: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // [uidA, uidB]
  participantDetails: Record<string, ParticipantInfo>;
  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 'messages' | 'profile' | 'settings';
export type ThemeMode = 'dark' | 'light' | 'system';
