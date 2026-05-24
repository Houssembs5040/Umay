'use client';

import { Home, Calendar, MessageCircle, TrendingUp, User } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/hooks/use-i18n';

interface BottomNavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function BottomNavbar({ currentTab, setCurrentTab }: BottomNavbarProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const navItems = [
    { 
      id: 'dashboard', 
      labelKey: 'nav.home', 
      icon: Home 
    },
    { 
      id: 'calendar', 
      labelKey: 'nav.calendar', 
      icon: Calendar 
    },
    { 
      id: 'chat', 
      labelKey: 'nav.chat', 
      icon: MessageCircle 
    },
    { 
      id: 'tracking', 
      labelKey: 'nav.tracking', 
      icon: TrendingUp 
    },
    { 
      id: 'profile', 
      labelKey: 'nav.profile', 
      icon: User 
    },
  ];

  return (
    <nav 
      className={`md:hidden fixed bottom-0 left-0 right-0 border-t shadow-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-pink-200/50'
      }`}
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all ${
                isActive
                  ? theme === 'dark'
                    ? 'text-pink-400 border-t-2 border-pink-400'
                    : 'text-pink-600 border-t-2 border-pink-600'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-pink-400'
                  : 'text-gray-600 hover:text-pink-500'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}