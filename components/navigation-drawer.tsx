"use client";

import { useState } from "react";
import {
  Home,
  Calendar,
  MessageCircle,
  TrendingUp,
  BookOpen,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";
import { Language } from "@/lib/i18n-context";

interface NavigationDrawerProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isLoggedIn: boolean;
  onLogout?: () => void;
  userName?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function NavigationDrawer({
  currentTab,
  setCurrentTab,
  isLoggedIn,
  onLogout,
  userName,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
}: NavigationDrawerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: "dashboard", label: t("nav.home"), icon: Home },
    { id: "calendar", label: t("nav.calendar"), icon: Calendar },
    { id: "chat", label: t("nav.chat"), icon: MessageCircle },
    { id: "tracking", label: t("nav.tracking"), icon: TrendingUp },
    { id: "advice", label: t("nav.advice"), icon: BookOpen },
    { id: "profile", label: t("nav.profile"), icon: User },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: "fr", label: "FR", flag: "🇫🇷" },
    { code: "en", label: "EN", flag: "🇬🇧" },
    { code: "ar", label: "عر", flag: "🇹🇳" },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-30 md:z-0 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto flex flex-col`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
            🤰
          </div>
          <div>
            <h2 className="font-bold text-sm">{t("app.title")}</h2>
            {isLoggedIn && userName && (
              <p className="text-xs text-primary-foreground/80 truncate max-w-[140px]">
                {userName}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 px-1">
            <Globe className="w-4 h-4 text-sidebar-foreground/70 flex-shrink-0" />
            <div className="flex gap-1 flex-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                    language === lang.code
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/30"
                  }`}
                  title={lang.label}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-all"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
            <span className="font-medium text-sm">
              {theme === "light"
                ? t("settings.switchToDark")
                : t("settings.switchToLight")}
            </span>
          </button>

          {/* Logout */}
          {isLoggedIn && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground hover:bg-destructive/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium text-sm">{t("nav.logout")}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
