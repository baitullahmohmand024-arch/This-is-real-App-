import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToMessages,
  sendMessage,
  deleteMessage
} from '../services/chat';
import { compressImage, uploadMediaFile } from '../services/storage';
import { Message, Conversation, MessageType } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { MediaLightbox } from './MediaLightbox';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Video,
  Mic,
  MicOff,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  MoreVertical,
  Smile,
  X,
  Play,
  Phone,
  Shield,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Active Media Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<'image' | 'video' | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Action / context menu on messages
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMsgMenu, setActiveMsgMenu] = useState<string | null>(null);
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Identify partner
  const partnerUid = conversation.participants.find((uid) => uid !== userProfile?.uid) || '';
  const partnerInfo = conversation.participantDetails?.[partnerUid] || {
    name: 'Partner',
    photoURL: '',
    status: 'offline',
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversation.id) return;
    const unsubscribe = subscribeToMessages(conversation.id, (newMessages) => {
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [conversation.id]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format message time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Send Text Message
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || !userProfile) return;

    setInputText('');
    setShowEmojiBar(false);
    setSending(true);

    try {
      await sendMessage(conversation.id, userProfile, {
        text: cleanText,
        type: 'text',
      });
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    setSending(true);
    setUploadProgress(10);
    try {
      // Compress photo for performance
      const compressedDataUrl = await compressImage(file, 1200, 0.82);
      setUploadProgress(70);

      await sendMessage(conversation.id, userProfile, {
        type: 'image',
        mediaUrl: compressedDataUrl,
        mediaSize: file.size,
      });
    } catch (err) {
      console.error('Failed to send image:', err);
    } finally {
      setSending(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Video Upload
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    // Limit to reasonable video size (e.g., 20MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('Please select a video under 25MB.');
      return;
    }

    setSending(true);
    setUploadProgress(15);
    try {
      const mediaUrl = await uploadMediaFile(file, 'videos', (progress) => {
        setUploadProgress(Math.round(progress));
      });

      await sendMessage(conversation.id, userProfile, {
        type: 'video',
        mediaUrl,
        mediaSize: file.size,
      });
    } catch (err) {
      console.error('Failed to send video:', err);
    } finally {
      setSending(false);
      setUploadProgress(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // Start Voice Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert('Microphone access is required to record voice messages.');
    }
  };

  // Stop & Send Voice Recording
  const stopAndSendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !userProfile) return;

    clearInterval(recordTimerRef.current);
    const duration = recordDuration;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setIsRecording(false);
      setRecordDuration(0);

      // Stop audio tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      if (duration < 1) return; // Too short

      setSending(true);
      try {
        const audioUrl = await uploadMediaFile(audioBlob, 'voice');
        await sendMessage(conversation.id, userProfile, {
          type: 'audio',
          mediaUrl: audioUrl,
          mediaDuration: duration,
        });
      } catch (err) {
        console.error('Failed to send voice note:', err);
      } finally {
        setSending(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  // Cancel Voice Recording
  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      clearInterval(recordTimerRef.current);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordDuration(0);
      audioChunksRef.current = [];
    }
  };

  // Copy message text
  const handleCopyMessage = (msg: Message) => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    setActiveMsgMenu(null);
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteMessage(conversation.id, msgId);
      setActiveMsgMenu(null);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Quick Emoji Insertion
  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const EMOJI_QUICK_LIST = ['❤️', '😊', '👍', '🔥', '✨', '🙏', '🥂', '🎉', '👏', '😍'];

  return (
    <div
      id="chat-view-container"
      className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 relative overflow-hidden"
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {/* Lightbox for Zoomable Media */}
      <MediaLightbox
        isOpen={!!lightboxUrl}
        onClose={() => {
          setLightboxUrl(null);
          setLightboxType(null);
        }}
        mediaUrl={lightboxUrl}
        mediaType={lightboxType}
        senderName={partnerInfo.name}
      />

      {/* Chat Header */}
      <header
        id="chat-header"
        className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20"
      >
        <div className="flex items-center gap-3">
          <button
            id="chat-back-btn"
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Partner Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full ring-1 ring-amber-500/40 overflow-hidden bg-zinc-800">
                <img
                  src={
                    partnerInfo.photoURL ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={partnerInfo.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900 ${
                  partnerInfo.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-500'
                }`}
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">
                {partnerInfo.name}
              </h2>
              <span className="text-[11px] text-zinc-400 font-medium">
                {partnerInfo.status === 'online' ? 'Active now' : 'Private chat'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <div className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-amber-300">
            <Shield className="w-3 h-3" />
            <span>End-to-End</span>
          </div>
        </div>
      </header>

      {/* Upload progress banner */}
      {uploadProgress !== null && (
        <div className="bg-amber-500/20 text-amber-300 text-xs py-1 px-4 flex items-center justify-between border-b border-amber-500/30">
          <span>Uploading media... {uploadProgress}%</span>
          <div className="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages Stream Container */}
      <main
        id="messages-stream"
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800"
        onClick={() => setActiveMsgMenu(null)}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-amber-400">
              <Smile className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-300 mb-1">
              Connected with {partnerInfo.name}
            </p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Say hello or send a photo to start this private conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userProfile?.uid;
            const isDeleted = !!msg.deleted;

            return (
              <div
                key={msg.id}
                id={`message-row-${msg.id}`}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
              >
                {/* Bubble Container */}
                <div className="relative max-w-[85%] sm:max-w-md">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                      isDeleted
                        ? 'bg-zinc-900 text-zinc-500 italic border border-zinc-800'
                        : isMe
                        ? 'bg-linear-to-br from-amber-600 to-amber-700 text-amber-50 rounded-tr-xs shadow-amber-900/20'
                        : 'bg-zinc-800/90 text-zinc-100 rounded-tl-xs border border-zinc-700/50'
                    }`}
                  >
                    {/* Message Content by Type */}
                    {isDeleted ? (
                      <p className="text-xs opacity-75">This message was deleted</p>
                    ) : (
                      <>
                        {/* 1. TEXT */}
                        {msg.type === 'text' && (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.text}
                          </p>
                        )}

                        {/* 2. IMAGE */}
                        {msg.type === 'image' && msg.mediaUrl && (
                          <div className="space-y-1.5">
                            <img
                              src={msg.mediaUrl}
                              alt="Attachment"
                              onClick={() => {
                                setLightboxUrl(msg.mediaUrl || null);
                                setLightboxType('image');
                              }}
                              className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              referrerPolicy="no-referrer"
                            />
                            {msg.text && <p className="text-xs pt-1">{msg.text}</p>}
                          </div>
                        )}

                        {/* 3. VIDEO */}
                        {msg.type === 'video' && msg.mediaUrl && (
                          <div className="space-y-1.5">
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="rounded-xl max-h-72 w-full object-cover bg-black"
                            />
                            {msg.text && <p className="text-xs pt-1">{msg.text}</p>}
                          </div>
                        )}

                        {/* 4. AUDIO / VOICE NOTE */}
                        {msg.type === 'audio' && msg.mediaUrl && (
                          <AudioPlayer
                            src={msg.mediaUrl}
                            duration={msg.mediaDuration}
                            isSender={isMe}
                          />
                        )}

                        {/* Micro Timestamp & Status indicator */}
                        <div
                          className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${
                            isMe ? 'text-amber-200/80' : 'text-zinc-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && !isDeleted && (
                            <span title={msg.status}>
                              <CheckCheck className="w-3 h-3 text-amber-200" />
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Message Action Trigger on hover / long tap */}
                  {!isDeleted && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 ${
                        isMe ? '-left-8' : '-right-8'
                      } opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMsgMenu(activeMsgMenu === msg.id ? null : msg.id);
                        }}
                        className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Action Menu Popover */}
                  {activeMsgMenu === msg.id && (
                    <div
                      className={`absolute bottom-full mb-1 z-30 ${
                        isMe ? 'right-0' : 'left-0'
                      } bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-1 flex items-center gap-1 text-xs`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {msg.text && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Copy</span>
                        </button>
                      )}

                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 hover:bg-red-950/50 text-red-400 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Quick Emoji Bar Toggleable */}
      {showEmojiBar && (
        <div
          id="quick-emoji-bar"
          className="px-4 py-2 bg-zinc-900/95 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto"
        >
          {EMOJI_QUICK_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleInsertEmoji(emoji)}
              className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <footer
        id="chat-input-bar"
        className="p-3 bg-zinc-900/90 border-t border-zinc-800/80 backdrop-blur-md z-20"
      >
        {isRecording ? (
          /* Active Voice Recording Bar */
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-red-950/30 border border-red-800/50 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Recording: {recordDuration}s</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="cancel-voice-btn"
                type="button"
                onClick={cancelVoiceRecording}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="send-voice-btn"
                type="button"
                onClick={stopAndSendVoiceRecording}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs text-zinc-950 font-medium cursor-pointer flex items-center gap-1 shadow-md"
              >
                <Send className="w-3 h-3" />
                <span>Send Voice</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Message Input */
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            {/* Media Attachment Actions */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                id="attach-photo-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-zinc-800 hover:text-amber-400 transition-colors cursor-pointer"
                title="Send Photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                id="attach-video-btn"
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-zinc-800 hover:text-amber-400 transition-colors cursor-pointer"
                title="Send Video"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                id="toggle-emoji-btn"
                type="button"
                onClick={() => setShowEmojiBar(!showEmojiBar)}
                className={`p-2 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer ${
                  showEmojiBar ? 'text-amber-400' : 'hover:text-amber-400'
                }`}
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            {/* Input Field */}
            <input
              id="message-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />

            {/* Send Text or Microphone button */}
            {inputText.trim() ? (
              <button
                id="send-message-btn"
                type="submit"
                disabled={sending}
                className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="record-voice-btn"
                type="button"
                onClick={startVoiceRecording}
                className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 transition-all transform active:scale-95 cursor-pointer"
                title="Hold or Tap to record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </footer>
    </div>
  );
};
