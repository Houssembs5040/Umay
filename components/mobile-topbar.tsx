'use client';

import { Menu, X } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/hooks/use-i18n';

interface MobileTopbarProps {
  titleKey?: string;        // e.g. 'nav.dashboard', 'nav.calendar', etc.
  fallbackTitle?: string;   // Optional fallback if no key is provided
  isDrawerOpen: boolean;
  onMenuClick: () => void;
}

export function MobileTopbar({ 
  titleKey, 
  fallbackTitle = 'UmayB', 
  isDrawerOpen, 
  onMenuClick 
}: MobileTopbarProps) {
  
  const { theme } = useTheme();
  const { t } = useI18n();
  console.log('titleKey:', titleKey, 'translated:', titleKey ? t(titleKey) : 'N/A');

  // Use translated title if key is provided, otherwise use fallback
  const displayTitle = titleKey === 'nav.dashboard' 
  ? t('nav.home') 
  : (titleKey ? t(titleKey) : fallbackTitle);

  return (
    <div 
      className={`md:hidden fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4">
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-lg transition-all ${
            theme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-200' 
              : 'hover:bg-muted text-foreground'
          }`}
          aria-label="Toggle menu"
        >
          {isDrawerOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Translated Title */}
        <h1 className="text-lg font-bold text-foreground text-center flex-1">
          {displayTitle}
        </h1>

        {/* Right spacer for balance */}
        <div className="w-10" />
      </div>
    </div>
  );
}