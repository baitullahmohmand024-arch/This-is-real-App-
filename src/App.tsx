import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SplashAuth } from './components/SplashAuth';
import { ProfileSetup } from './components/ProfileSetup';
import { MessagesList } from './components/MessagesList';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { Navigation } from './components/Navigation';
import { InviteModal } from './components/InviteModal';
import { Conversation, ActiveTab } from './types';
import { MessageCircle } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    currentUser,
    userProfile,
    loading,
    profileLoading,
    pendingInviteToken,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('messages');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [modalInitialToken, setModalInitialToken] = useState<string | null>(null);

  // Auto-open invite modal if user lands with invite token
  useEffect(() => {
    if (currentUser && userProfile && pendingInviteToken) {
      setModalInitialToken(pendingInviteToken);
      setIsInviteModalOpen(true);
    }
  }, [currentUser, userProfile, pendingInviteToken]);

  // Loading State
  if (loading || profileLoading) {
    return (
      <div
        id="app-loader"
        className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 animate-pulse">
          <MessageCircle className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
            Aura Encrypted Messenger
          </span>
        </div>
      </div>
    );
  }

  // 1. Not Authenticated -> Google Login / Quick Test Mode
  if (!currentUser) {
    return <SplashAuth />;
  }

  // 2. Authenticated but first time (no profile) -> Profile Setup
  if (!userProfile) {
    return <ProfileSetup onCompleted={() => setActiveTab('messages')} />;
  }

  // 3. Active Chat View -> Takes full screen
  if (activeConversation) {
    return (
      <ChatView
        conversation={activeConversation}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  // 4. Main Views (Messages, Profile, Settings)
  return (
    <div
      id="main-app-container"
      className="min-h-screen w-full bg-zinc-950 flex flex-col justify-between"
    >
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {activeTab === 'messages' && (
          <MessagesList
            onSelectConversation={(conv) => setActiveConversation(conv)}
            onOpenInviteModal={() => {
              setModalInitialToken(null);
              setIsInviteModalOpen(true);
            }}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView onBack={() => setActiveTab('messages')} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onBack={() => setActiveTab('messages')}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Invitation Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setModalInitialToken(null);
        }}
        initialToken={modalInitialToken}
        onConversationOpened={(conv) => {
          setIsInviteModalOpen(false);
          setActiveConversation(conv);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
