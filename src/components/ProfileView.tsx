import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LUXURY_AVATAR_PRESETS } from '../utils/avatars';
import { compressImage } from '../services/storage';
import {
  ArrowLeft,
  Camera,
  Check,
  LogOut,
  User,
  Mail,
  Copy,
  Key,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { userProfile, createOrUpdateProfile, logout } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleCustomPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 0.85);
      setPhotoURL(compressed);
      setIsEditing(true);
    } catch (err) {
      console.error('Photo compress error:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      await createOrUpdateProfile(name.trim(), photoURL);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUid = () => {
    if (userProfile?.uid) {
      navigator.clipboard.writeText(userProfile.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <div
      id="profile-view-container"
      className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 max-w-3xl mx-auto border-x border-zinc-900 overflow-y-auto"
    >
      {/* Header */}
      <header className="h-16 px-4 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            id="profile-back-btn"
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white font-serif">
            My Profile
          </h2>
        </div>

        {isEditing && (
          <button
            id="save-profile-header-btn"
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold cursor-pointer shadow-md"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </header>

      <main className="p-6 space-y-6 max-w-md mx-auto w-full">
        {msg && (
          <div
            className={`p-3 rounded-xl text-xs text-center border ${
              msg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Profile Avatar Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl relative">
          <div className="relative group mb-4">
            <div className="w-24 h-24 rounded-full ring-2 ring-amber-500/70 p-1 bg-zinc-950 overflow-hidden shadow-xl">
              <img
                src={
                  photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={userProfile?.name}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Camera upload overlay */}
            <label
              htmlFor="profile-photo-change"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <input
                id="profile-photo-change"
                type="file"
                accept="image/*"
                onChange={handleCustomPhoto}
                className="hidden"
              />
            </label>
          </div>

          <h3 className="text-lg font-semibold text-white font-serif">
            {userProfile?.name}
          </h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-zinc-500" />
            <span>{userProfile?.email || 'Authenticated User'}</span>
          </p>
        </div>

        {/* Avatar Preset Picker */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-xs font-medium text-zinc-300 mb-2.5">
            Select portrait avatar:
          </p>
          <div className="grid grid-cols-4 gap-2">
            {LUXURY_AVATAR_PRESETS.map((preset) => {
              const isSelected = photoURL === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setPhotoURL(preset.url);
                    setIsEditing(true);
                  }}
                  className={`relative rounded-xl p-0.5 transition-all overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-400 scale-105 shadow-md shadow-amber-500/20'
                      : 'opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-12 h-12 rounded-lg object-cover mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/25 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-amber-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">
            Display Name
          </label>
          <div className="relative">
            <input
              id="edit-profile-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsEditing(true);
              }}
              className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
            />
            <User className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* User UID info */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Key className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                User ID
              </p>
              <p className="font-mono text-zinc-300 truncate max-w-[200px]">
                {userProfile?.uid}
              </p>
            </div>
          </div>

          <button
            id="copy-uid-btn"
            type="button"
            onClick={handleCopyUid}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
            title="Copy User ID"
          >
            {copiedUid ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Logout Button */}
        <button
          id="profile-logout-btn"
          type="button"
          onClick={logout}
          className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/50 text-zinc-300 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </main>
    </div>
  );
};
