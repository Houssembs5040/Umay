'use client';

import { useI18n } from '@/hooks/use-i18n';
import { Language } from '@/lib/i18n-context';

interface LanguageSelectorProps {
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({ showLabel = true, className = '' }: LanguageSelectorProps) {
  // Safe access with fallback
  let language: Language = 'fr';
  let setLanguage = (lang: Language) => {};
  let t = (key: string) => key;

  try {
    const i18n = useI18n();
    language = i18n.language;
    setLanguage = i18n.setLanguage;
    t = i18n.t;
  } catch (error) {
    // During initial hydration or if provider not ready yet
    console.warn('I18n context not ready yet');
  }

  const languages: Array<{ code: Language; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <label className="text-sm font-medium">{t('settings.language')}:</label>}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}