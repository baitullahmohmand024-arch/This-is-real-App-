import React, { useState } from 'react';
import { signInWithGoogle } from '../services/auth';
import { signInAnonymously, updateProfile as updateAuthProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Shield, Sparkles, MessageCircle, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface SplashAuthProps {
  onSuccess?: () => void;
}

export const SplashAuth: React.FC<SplashAuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick simulation logins for effortlessly testing Person A and Person B in dual tabs or single browser
  const handleQuickTestSignIn = async (name: string, photoURL: string) => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInAnonymously(auth);
      await updateAuthProfile(cred.user, {
        displayName: name,
        photoURL: photoURL,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError(err.message || 'Failed to initialize session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="splash-auth-container"
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-zinc-900 via-zinc-950 to-black text-zinc-100 relative overflow-hidden"
    >
      {/* Background Luxury Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

      <motion.div
        id="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-zinc-900/80 border border-zinc-800/90 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 flex flex-col items-center text-center"
      >
        {/* Brand Icon Monogram */}
        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center mb-6 shadow-inner">
          <MessageCircle className="w-10 h-10 text-amber-400" />
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 font-serif">
          AURA
        </h1>
        <p className="text-xs uppercase tracking-widest text-amber-400/90 font-medium mb-6">
          Private Real-Time Messaging
        </p>

        <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-xs">
          Exclusive, end-to-end private conversations connected through secure invitation tokens.
        </p>

        {/* Error Alert */}
        {error && (
          <motion.div
            id="auth-error-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full mb-6 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Primary Action: Google Sign-In */}
        <button
          id="google-signin-btn"
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm flex items-center justify-center gap-3 transition-all transform active:scale-98 shadow-lg hover:shadow-white/10 disabled:opacity-50 cursor-pointer mb-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Quick Testing Options for dual Person A / Person B browser testing */}
        <div className="w-full border-t border-zinc-800/80 pt-5 mt-2">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">
            Instant Test Switcher (Simulate 2 Users)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="test-person-a-btn"
              type="button"
              disabled={loading}
              onClick={() =>
                handleQuickTestSignIn(
                  'Alexander Wright',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                )
              }
              className="py-2 px-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Person A (Alex)</span>
            </button>

            <button
              id="test-person-b-btn"
              type="button"
              disabled={loading}
              onClick={() =>
                handleQuickTestSignIn(
                  'Sarah Jenkins',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                )
              }
              className="py-2 px-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Person B (Sarah)</span>
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-6">
          <Shield className="w-3.5 h-3.5 text-amber-500/70" />
          <span>Encrypted invitation routing • No public directories</span>
        </div>
      </motion.div>
    </div>
  );
};
