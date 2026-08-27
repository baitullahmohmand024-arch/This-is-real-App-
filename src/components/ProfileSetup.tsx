import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LUXURY_AVATAR_PRESETS } from '../utils/avatars';
import { compressImage } from '../services/storage';
import { Camera, Check, Sparkles, ArrowRight, User } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileSetupProps {
  onCompleted: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onCompleted }) => {
  const { currentUser, createOrUpdateProfile } = useAuth();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [selectedPhoto, setSelectedPhoto] = useState(
    currentUser?.photoURL || LUXURY_AVATAR_PRESETS[0].url
  );
  const [customUploading, setCustomUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setCustomUploading(true);
    setError(null);
    try {
      const compressedDataUrl = await compressImage(file, 400, 0.85);
      setSelectedPhoto(compressedDataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError('Failed to process image. Please choose another.');
    } finally {
      setCustomUploading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your name to continue.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createOrUpdateProfile(cleanName, selectedPhoto);
      onCompleted();
    } catch (err: any) {
      console.error('Failed to create profile:', err);
      setError(err.message || 'Unable to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="profile-setup-container"
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-zinc-900 via-zinc-950 to-black text-zinc-100 relative"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        id="profile-setup-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white mb-1 font-serif">
            Create Your Profile
          </h2>
          <p className="text-xs text-zinc-400">
            Choose your appearance and name for private conversations.
          </p>
        </div>

        {error && (
          <div
            id="profile-error"
            className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6">
          {/* Active Profile Picture Display with Upload Trigger */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full ring-2 ring-amber-500/60 p-1 bg-zinc-950 overflow-hidden shadow-lg">
                <img
                  src={selectedPhoto}
                  alt="Selected avatar"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Upload Overlay Button */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105 active:scale-95"
                title="Upload custom photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCustomPhoto}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2">
              {customUploading ? 'Processing photo...' : 'Tap camera icon for custom photo'}
            </span>
          </div>

          {/* Preset Avatar Selection Grid */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Or pick an aesthetic portrait:
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {LUXURY_AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedPhoto === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPhoto(preset.url)}
                    className={`relative rounded-xl p-0.5 transition-all overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-12 h-12 rounded-lg object-cover mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Check className="w-4 h-4 text-amber-300 drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="name-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Your Name <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                id="name-input"
                type="text"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-zinc-950/80 border border-zinc-700/70 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Continue Button */}
          <button
            id="profile-continue-btn"
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 transition-all transform active:scale-98 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Messages</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
