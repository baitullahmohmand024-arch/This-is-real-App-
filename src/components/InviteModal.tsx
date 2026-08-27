import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createInvitation,
  validateInvitationToken,
  markInvitationAsUsed
} from '../services/invitations';
import { getOrCreateConversation } from '../services/chat';
import { Conversation, Invitation } from '../types';
import {
  Link2,
  Clipboard,
  Share2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationOpened: (conv: Conversation) => void;
  initialToken?: string | null;
}

type ModalView = 'menu' | 'generate' | 'paste' | 'preview_inviter';

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onConversationOpened,
  initialToken,
}) => {
  const { userProfile, setPendingInviteToken } = useAuth();

  const [view, setView] = useState<ModalView>('menu');
  const [loading, setLoading] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Paste flow state
  const [inputTokenOrUrl, setInputTokenOrUrl] = useState('');
  const [foundInvitation, setFoundInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialToken) {
        setView('paste');
        setInputTokenOrUrl(initialToken);
        handleValidateToken(initialToken);
      } else {
        setView('menu');
        setError(null);
        setCreatedInviteUrl(null);
        setFoundInvitation(null);
      }
    }
  }, [isOpen, initialToken]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#d97706', '#fbbf24', '#ffffff'],
      });
    } catch (e) {
      // Confetti fallback silent
    }
  };

  // 1. Generate invitation
  const handleGenerate = async () => {
    if (!userProfile) return;
    setLoading(true);
    setError(null);
    try {
      const { inviteUrl } = await createInvitation(userProfile);
      setCreatedInviteUrl(inviteUrl);
      setView('generate');
      triggerConfetti();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdInviteUrl) return;
    try {
      await navigator.clipboard.writeText(createdInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    if (!createdInviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Aura Private Messenger',
          text: `Hey, let's chat privately on Aura:`,
          url: createdInviteUrl,
        });
      } catch (err) {
        // User cancelled share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  // 2. Extract token from full url or raw token
  const extractToken = (input: string): string => {
    try {
      if (input.includes('invite=')) {
        const url = new URL(input.startsWith('http') ? input : `https://${input}`);
        return url.searchParams.get('invite') || input;
      }
    } catch (e) {
      // Not a full URL, treat as raw token
    }
    return input.trim();
  };

  // 3. Validate Token
  const handleValidateToken = async (rawInput?: string) => {
    const textToValidate = extractToken(rawInput || inputTokenOrUrl);
    if (!textToValidate) {
      setError('Please paste a valid invitation link or token.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await validateInvitationToken(textToValidate, userProfile?.uid);
      if (!result.isValid || !result.invitation) {
        setError(
          result.errorMessage ||
            'This invitation is no longer valid. Please ask your friend to create a new invitation.'
        );
        setFoundInvitation(null);
      } else {
        setFoundInvitation(result.invitation);
        setView('preview_inviter');
      }
    } catch (err: any) {
      setError('Unable to validate invitation. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputTokenOrUrl(text);
        handleValidateToken(text);
      }
    } catch (err) {
      // Clipboard permissions denied
    }
  };

  // 4. Connect & Start Chat
  const handleConnectAndStartChat = async () => {
    if (!userProfile || !foundInvitation) return;
    setConnecting(true);
    setError(null);
    try {
      // Connect Person A <-> Person B with duplicate prevention
      const partnerData = {
        uid: foundInvitation.createdBy,
        name: foundInvitation.creatorName,
        photoURL: foundInvitation.creatorPhotoURL,
        email: foundInvitation.creatorEmail,
      };

      const conversation = await getOrCreateConversation(userProfile, partnerData);

      // Mark invitation as used
      await markInvitationAsUsed(foundInvitation.id, userProfile.uid);

      // Clear any pending token in storage
      setPendingInviteToken(null);

      triggerConfetti();

      // Automatically navigate to the conversation
      onConversationOpened(conversation);
      onClose();
    } catch (err: any) {
      console.error('Error connecting chat:', err);
      setError('Could not establish private connection. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="invite-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="invite-modal-card"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-zinc-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            id="invite-modal-close-btn"
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* VIEW 1: Main Menu */}
          {view === 'menu' && (
            <div className="text-center pt-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1 font-serif">
                Start a Chat
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Connect with someone privately.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  id="generate-invite-option-btn"
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className="w-full py-3.5 px-5 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium text-sm flex items-center justify-center gap-2.5 transition-all transform active:scale-98 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Generate Invitation Link</span>
                    </>
                  )}
                </button>

                <button
                  id="paste-invite-option-btn"
                  type="button"
                  onClick={() => {
                    setView('paste');
                    setError(null);
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-200 font-medium text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Clipboard className="w-4 h-4 text-zinc-400" />
                  <span>Paste Invitation Link</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero spam • One-on-one direct authentication</span>
              </div>
            </div>
          )}

          {/* VIEW 2: Generate Invitation Link */}
          {view === 'generate' && (
            <div className="text-center pt-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1 font-serif">
                You're ready to connect ❤️
              </h3>
              <p className="text-xs text-zinc-400 mb-5">
                Share this invitation with your friend.
              </p>

              {/* Link Display Box */}
              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 mb-4 text-left">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                  Secure Invitation Link
                </p>
                <p className="text-xs text-amber-300 font-mono break-all line-clamp-2 select-all">
                  {createdInviteUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  id="copy-invite-link-btn"
                  type="button"
                  onClick={handleCopyLink}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  id="share-invite-link-btn"
                  type="button"
                  onClick={handleShare}
                  className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-700/60"
                >
                  <Share2 className="w-4 h-4 text-zinc-300" />
                  <span>Share</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 mb-6">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Invitation expires after 48 hours • One-time use</span>
              </div>

              <button
                id="generate-done-btn"
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* VIEW 3: Paste Invitation Link */}
          {view === 'paste' && (
            <div className="text-center pt-2">
              <h3 className="text-xl font-semibold text-white mb-1 font-serif">
                Join a Chat
              </h3>
              <p className="text-xs text-zinc-400 mb-5">
                Paste your invitation link below.
              </p>

              {error && (
                <div
                  id="paste-error-banner"
                  className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="relative">
                  <input
                    id="invite-input-field"
                    type="text"
                    value={inputTokenOrUrl}
                    onChange={(e) => setInputTokenOrUrl(e.target.value)}
                    placeholder="Paste invitation link or token here"
                    className="w-full bg-zinc-950 border border-zinc-700/70 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none pr-16 font-mono"
                  />
                  <button
                    id="paste-clipboard-btn"
                    type="button"
                    onClick={handleClipboardPaste}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-[11px] text-amber-400 font-medium cursor-pointer"
                  >
                    Paste
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="cancel-paste-btn"
                    type="button"
                    onClick={() => setView('menu')}
                    className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    id="connect-validate-btn"
                    type="button"
                    disabled={loading || !inputTokenOrUrl.trim()}
                    onClick={() => handleValidateToken()}
                    className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-98 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Connect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: Preview Inviter & Connect */}
          {view === 'preview_inviter' && foundInvitation && (
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Invitation Found</span>
              </div>

              <p className="text-xs text-zinc-400 mb-4">
                You're invited to chat with:
              </p>

              {/* Inviter Avatar and Name */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 mb-6 shadow-inner">
                <div className="w-20 h-20 rounded-full ring-2 ring-amber-500/80 p-0.5 mb-3">
                  <img
                    src={
                      foundInvitation.creatorPhotoURL ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={foundInvitation.creatorName}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="text-lg font-semibold text-white">
                  {foundInvitation.creatorName}
                </h4>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                  <UserCheck className="w-3 h-3 text-amber-400" />
                  <span>Verified Aura Member</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="preview-cancel-btn"
                  type="button"
                  onClick={() => setView('menu')}
                  className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="confirm-start-chat-btn"
                  type="button"
                  disabled={connecting}
                  onClick={handleConnectAndStartChat}
                  className="py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-98 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {connecting ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Connect & Start Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
