import React from 'react';
import { ActiveTab } from '../types';
import { MessageSquare, User, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="h-16 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-6 flex items-center justify-around max-w-3xl mx-auto w-full z-10 shrink-0"
    >
      <button
        id="nav-tab-messages"
        type="button"
        onClick={() => onTabChange('messages')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-4 rounded-xl ${
          activeTab === 'messages'
            ? 'text-amber-400 font-medium'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px]">Messages</span>
      </button>

      <button
        id="nav-tab-profile"
        type="button"
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-4 rounded-xl ${
          activeTab === 'profile'
            ? 'text-amber-400 font-medium'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </button>

      <button
        id="nav-tab-settings"
        type="button"
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-4 rounded-xl ${
          activeTab === 'settings'
            ? 'text-amber-400 font-medium'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Settings</span>
      </button>
    </nav>
  );
};
