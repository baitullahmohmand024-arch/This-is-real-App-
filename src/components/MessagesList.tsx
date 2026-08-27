import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToConversations } from '../services/chat';
import { Conversation } from '../types';
import {
  Plus,
  Search,
  MessageCircle,
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface MessagesListProps {
  onSelectConversation: (conv: Conversation) => void;
  onOpenInviteModal: () => void;
  onOpenProfile: () => void;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  onSelectConversation,
  onOpenInviteModal,
  onOpenProfile,
}) => {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubscribe = subscribeToConversations(
      userProfile.uid,
      (convs) => {
        setConversations(convs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching conversations:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.uid]);

  // Format timestamp for conversation list
  const formatListTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter conversations by partner name
  const filteredConversations = conversations.filter((conv) => {
    const partnerUid = conv.participants.find((uid) => uid !== userProfile?.uid) || '';
    const partner = conv.participantDetails?.[partnerUid];
    const name = partner?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div
      id="messages-screen-container"
      className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 max-w-3xl mx-auto border-x border-zinc-900 shadow-2xl relative"
    >
      {/* Top Header */}
      <header
        id="messages-header"
        className="h-20 shrink-0 px-6 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          {/* User Profile Avatar with trigger */}
          <button
            id="user-profile-avatar-btn"
            type="button"
            onClick={onOpenProfile}
            className="relative group p-0.5 rounded-full ring-2 ring-amber-500/50 hover:ring-amber-400 transition-all cursor-pointer"
            title="View profile"
          >
            <img
              src={
                userProfile?.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={userProfile?.name || 'My profile'}
              className="w-10 h-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
          </button>

          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight font-serif">
              Messages
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              {userProfile?.name}
            </p>
          </div>
        </div>

        {/* Primary Action: Plus Button */}
        <button
          id="plus-start-chat-btn"
          type="button"
          onClick={onOpenInviteModal}
          className="w-11 h-11 rounded-2xl bg-linear-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 flex items-center justify-center transition-all transform active:scale-95 shadow-lg shadow-amber-500/25 cursor-pointer"
          title="Start a new chat"
          aria-label="Start a new chat"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </header>

      {/* Search Input Filter (if conversations exist) */}
      {conversations.length > 0 && (
        <div className="px-6 py-3 border-b border-zinc-900/80 bg-zinc-950">
          <div className="relative">
            <input
              id="conversation-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-amber-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Conversations List / Empty State */}
      <main className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-2 sm:p-4">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          /* Empty State */
          <div
            id="empty-conversations-state"
            className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-6 text-zinc-400"
          >
            <div className="w-20 h-20 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center mb-5 text-amber-400 shadow-inner">
              <MessageCircle className="w-10 h-10 stroke-[1.5]" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2 font-serif">
              No conversations yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-8 leading-relaxed">
              Connect with someone to start messaging privately.
            </p>

            <button
              id="empty-state-plus-btn"
              type="button"
              onClick={onOpenInviteModal}
              className="py-3.5 px-6 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium text-xs flex items-center gap-2 transition-all transform active:scale-98 shadow-xl shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Connect with someone</span>
            </button>
          </div>
        ) : (
          /* Conversation Item List */
          filteredConversations.map((conv) => {
            const partnerUid =
              conv.participants.find((uid) => uid !== userProfile?.uid) || '';
            const partner = conv.participantDetails?.[partnerUid] || {
              name: 'Friend',
              photoURL: '',
              status: 'offline',
            };

            const isLastSenderMe = conv.lastMessageSenderId === userProfile?.uid;

            return (
              <motion.div
                key={conv.id}
                id={`conversation-item-${conv.id}`}
                whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.4)' }}
                onClick={() => onSelectConversation(conv)}
                className="flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-colors group"
              >
                {/* Partner Avatar with Presence pip */}
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-2xl ring-1 ring-zinc-700/60 group-hover:ring-amber-500/50 overflow-hidden bg-zinc-900 transition-all">
                    <img
                      src={
                        partner.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={partner.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-zinc-950 ${
                      partner.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                  />
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                      {partner.name}
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                      {formatListTimestamp(conv.lastMessageAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                    {/* Media Type Icons */}
                    {conv.lastMessageType === 'image' && (
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    {conv.lastMessageType === 'video' && (
                      <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    {conv.lastMessageType === 'audio' && (
                      <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}

                    <span className="truncate">
                      {isLastSenderMe && <span className="text-zinc-500">You: </span>}
                      {conv.lastMessage || 'No messages yet'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
};
