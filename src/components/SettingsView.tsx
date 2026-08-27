import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft,
  Moon,
  Sun,
  Laptop,
  Bell,
  Shield,
  UserX,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Lock,
  Volume2
} from 'lucide-react';

interface SettingsViewProps {
  onBack: () => void;
  onOpenProfile: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onOpenProfile }) => {
  const { userProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlinePresence, setOnlinePresence] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div
      id="settings-view-container"
      className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 max-w-3xl mx-auto border-x border-zinc-900 overflow-y-auto"
    >
      {/* Header */}
      <header className="h-16 px-4 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            id="settings-back-btn"
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white font-serif">
            Settings
          </h2>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Account Section */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Account
          </p>
          <div
            onClick={onOpenProfile}
            className="p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  userProfile?.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={userProfile?.name}
                className="w-11 h-11 rounded-full object-cover ring-1 ring-amber-500/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-sm font-medium text-white">{userProfile?.name}</h4>
                <p className="text-xs text-zinc-400">{userProfile?.email || 'Authenticated'}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Appearance
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-2 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Preferences & Privacy
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60">
            {/* Sound Effects */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-zinc-300">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">Message Chimes</p>
                  <p className="text-[10px] text-zinc-500">Play soft sound on messages</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Online Status */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-zinc-300">
                <Shield className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">Online Presence</p>
                  <p className="text-[10px] text-zinc-500">Show when active to connected friends</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onlinePresence}
                onChange={(e) => setOnlinePresence(e.target.checked)}
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Privacy Architecture info */}
            <div
              onClick={() => setActiveModal('privacy')}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/80 transition-colors"
            >
              <div className="flex items-center gap-3 text-zinc-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">Zero Public Directory</p>
                  <p className="text-[10px] text-zinc-500">Invitation-only connections</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Blocked Users */}
            <div
              onClick={() => setActiveModal('blocked')}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/80 transition-colors"
            >
              <div className="flex items-center gap-3 text-zinc-300">
                <UserX className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-xs font-medium text-white">Blocked Contacts</p>
                  <p className="text-[10px] text-zinc-500">0 blocked users</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        </section>

        {/* Help & Support */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            About
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60">
            <div
              onClick={() => setActiveModal('help')}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/80 transition-colors"
            >
              <div className="flex items-center gap-3 text-zinc-300">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-white">How Invitations Work</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        </section>

        {/* Logout */}
        <button
          id="settings-logout-btn"
          type="button"
          onClick={logout}
          className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/50 text-zinc-300 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </main>

      {/* Info Modals */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {activeModal === 'privacy' && (
              <>
                <h3 className="text-base font-semibold text-white mb-2 font-serif">
                  Privacy Architecture
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Aura operates strictly on a closed one-to-one invitation protocol. There are no public user lists, no searchable usernames, and no unsolicited messaging.
                </p>
              </>
            )}

            {activeModal === 'help' && (
              <>
                <h3 className="text-base font-semibold text-white mb-2 font-serif">
                  How Invitations Work
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Tap the + button on your Messages screen to generate a cryptographically secure token. Send the link to your friend. Once they connect, a private, real-time encrypted conversation opens automatically.
                </p>
              </>
            )}

            {activeModal === 'blocked' && (
              <>
                <h3 className="text-base font-semibold text-white mb-2 font-serif">
                  Blocked Contacts
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  You currently have no blocked contacts. Since all conversations require an invitation link, only invited friends can reach you.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
