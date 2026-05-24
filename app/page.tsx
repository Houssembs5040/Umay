"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Heart,
  Calendar,
  TrendingUp,
  AlertCircle,
  Bell,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  Phone,
  Moon,
  Sun,
  Send,
  Baby,
  Globe,
  LogOut,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  X,
  Plus,
  Activity,
  Droplets,
  Paperclip,
  Camera,
  ImageIcon,
  FileText,
  MessageSquarePlus,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAppointments } from "@/hooks/use-appointments";
import { useAlerts } from "@/hooks/use-alerts";
import { useChat } from "@/hooks/use-chat";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";
import { useWeight } from "@/hooks/use-weight";
import { useBloodPressure } from "@/hooks/use-blood-pressure";
import { useGlucose } from "@/hooks/use-glucose";
import { useFetalMovements } from "@/hooks/use-fetal-movements";
import { useTips } from "@/hooks/use-tips";
import { useSettings } from "@/hooks/use-settings";

import { NavigationDrawer } from "@/components/navigation-drawer";
import { BottomNavbar } from "@/components/bottom-navbar";
import { MobileTopbar } from "@/components/mobile-topbar";
import { LanguageSelector } from "@/components/language-selector";
import { Language } from "@/lib/i18n-context";
import { apiClient, BackendAlert } from "@/lib/api-client";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStatusLabel(status: string, t: (k: string) => string) {
  if (status === "planned") return t("calendar.upcoming");
  if (status === "upcoming") return t("calendar.upcoming");
  if (status === "done" || status === "completed")
    return t("calendar.completed");
  if (status === "missed") return t("calendar.missed") ?? "Manqué";
  if (status === "postponed") return t("calendar.postponed") ?? "Reporté";
  if (status === "cancelled") return t("calendar.cancelled");
  return status;
}

function getStatusColor(status: string) {
  if (status === "done" || status === "completed")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (status === "missed" || status === "cancelled")
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (status === "postponed")
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  // planned / upcoming
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
}

function getSeverityColor(severity: string) {
  if (severity === "urgent")
    return "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10";
  if (severity === "warning")
    return "border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/10";
  return "border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10";
}

function getSeverityIconColor(severity: string) {
  if (severity === "urgent") return "text-red-600 dark:text-red-400";
  if (severity === "warning") return "text-orange-600 dark:text-orange-400";
  return "text-blue-600 dark:text-blue-400";
}

function getSeverityBadge(severity: string) {
  if (severity === "urgent")
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
  if (severity === "warning")
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded fallback tips
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_TIPS = [
  {
    key: "nutrition",
    icon: "🥗",
    titleKey: "advice.nutrition",
    tips: {
      fr: [
        "Mangez équilibré et varié",
        "Buvez 8 verres d'eau par jour",
        "Prenez vos vitamines prénatales",
      ],
      en: [
        "Eat balanced and varied meals",
        "Drink 8 glasses of water daily",
        "Take your prenatal vitamins",
      ],
      ar: [
        "تناولي وجبات متوازنة ومتنوعة",
        "اشربي 8 أكواب ماء يومياً",
        "خذي فيتامينات ما قبل الولادة",
      ],
    },
  },
  {
    key: "activity",
    icon: "🧘‍♀️",
    titleKey: "advice.exercise",
    tips: {
      fr: [
        "Marchez 30 minutes par jour",
        "Pratiquez le yoga prénatal",
        "Évitez les efforts intenses",
      ],
      en: [
        "Walk 30 minutes per day",
        "Practice prenatal yoga",
        "Avoid intense physical exertion",
      ],
      ar: ["تمشي 30 دقيقة يومياً", "مارسي يوغا الحمل", "تجنبي المجهود الشديد"],
    },
  },
  {
    key: "supplements",
    icon: "💊",
    titleKey: "advice.sleep",
    tips: {
      fr: [
        "Dormez 8-9 heures par nuit",
        "Créez une routine de sommeil",
        "Évitez les écrans avant de dormir",
      ],
      en: [
        "Sleep 8–9 hours per night",
        "Create a sleep routine",
        "Avoid screens before bedtime",
      ],
      ar: [
        "نامي 8-9 ساعات ليلاً",
        "أنشئي روتين للنوم",
        "تجنبي الشاشات قبل النوم",
      ],
    },
  },
  {
    key: "mental_health",
    icon: "🧠",
    titleKey: "advice.mental",
    tips: {
      fr: [
        "Méditez quotidiennement",
        "Partagez vos émotions",
        "Rejoignez un groupe de soutien",
      ],
      en: ["Meditate daily", "Share your feelings", "Join a support group"],
      ar: ["تأملي يومياً", "شاركي مشاعرك", "انضمي لمجموعة دعم"],
    },
  },
];

const CATEGORY_ICON: Record<string, string> = {
  nutrition: "🥗",
  activity: "🧘‍♀️",
  supplements: "💊",
  mental_health: "🧠",
  birth_prep: "👶",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Page() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useI18n();

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Chat
  const {
    conversations,
    activeConversation,
    messages,
    isStreaming,
    isLoadingConversations,
    isLoadingMessages,
    loadConversations,
    selectConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
  } = useChat();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat – attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat – conversation list (mobile shows either list or chat)
  const [showConvList, setShowConvList] = useState(true);

  // Chat – inline rename
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Auth
  const {
    user,
    isLoggedIn,
    isLoading,
    login,
    register,
    logout,
    error: authError,
  } = useAuth();

  // Data — only fetch when logged in
  const shouldFetch = !isLoading && isLoggedIn;
  const { data: dashboardData, isLoading: dashLoading } =
    useDashboard(shouldFetch);
  const {
    appointments,
    isLoading: aptsLoading,
    generatePrenatalPlan,
    createAppointment,
  } = useAppointments(shouldFetch);
  const {
    alerts,
    isLoading: alertsLoading,
    resolveAlert,
  } = useAlerts(shouldFetch);

  // Tracking hooks
  const {
    measurements: weightMeasurements,
    latestWeight,
    addEntry: addWeight,
    isLoading: weightLoading,
  } = useWeight(shouldFetch);
  const {
    measurements: bpMeasurements,
    latest: latestBP,
    addEntry: addBP,
    isLoading: bpLoading,
  } = useBloodPressure(shouldFetch);
  const {
    measurements: glucoseMeasurements,
    latest: latestGlucose,
    addEntry: addGlucose,
    isLoading: glucoseLoading,
  } = useGlucose(shouldFetch);
  const {
    openSession,
    startSession,
    increment: incrementMovement,
    endSession,
  } = useFetalMovements(shouldFetch);

  // Tips & Settings
  const { data: tipsData, isLoading: tipsLoading } = useTips(shouldFetch);
  const { settings, updateSettings } = useSettings(shouldFetch);

  // Extra profile data loaded lazily
  const [profile, setProfile] = useState<{
    name?: string;
    email?: string;
    age?: number;
    city?: string;
    height_cm?: number;
    date_of_birth?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Auth form
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    name: "",
    lmpDate: "",
    email: "",
    age: "",
    city: "",
    height: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Calendar / Appointments
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    type: "consultation",
    title: "",
    appointment_date: "",
    appointment_time: "",
    location: "",
    doctor_name: "",
    notes: "",
  });

  // Tracking forms
  const [weightForm, setWeightForm] = useState({ weight_kg: "", note: "" });
  const [bpForm, setBpForm] = useState({
    systolic: "",
    diastolic: "",
    note: "",
  });
  const [glucoseForm, setGlucoseForm] = useState({
    fasting_value: "",
    postprandial_value: "",
    note: "",
  });
  const [trackingSubmitting, setTrackingSubmitting] = useState<string | null>(
    null,
  );

  // Gestational weeks for fetal movements
  const gestationalWeeks = dashboardData?.gestational_age?.weeks ?? 0;

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations when the chat tab opens
  useEffect(() => {
    if (currentTab === "chat" && isLoggedIn) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, isLoggedIn]);

  // Load extra profile data when profile tab opens
  useEffect(() => {
    if (currentTab === "profile" && isLoggedIn && !profile && !profileLoading) {
      setProfileLoading(true);
      apiClient
        .getProfile()
        .then((res) => {
          if (res.success && res.data) setProfile(res.data);
        })
        .finally(() => setProfileLoading(false));
    }
  }, [currentTab, isLoggedIn, profile, profileLoading]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    if (showLoginForm) {
      if (!formData.phone || !formData.password) {
        setFormError(t("auth.required"));
        setIsSubmitting(false);
        return;
      }
      const res = await login(formData.phone, formData.password);
      if (!res.success) setFormError(res.error || "Login failed");
    } else {
      if (!formData.phone || !formData.password || !formData.lmpDate) {
        setFormError(t("auth.required"));
        setIsSubmitting(false);
        return;
      }
      const age = formData.age ? parseInt(formData.age) : undefined;
      const height = formData.height ? parseFloat(formData.height) : undefined;
      const res = await register(
        formData.phone,
        formData.password,
        formData.lmpDate,
        formData.name || undefined,
        formData.email || undefined,
        age,
        formData.city || undefined,
        height,
      );
      if (!res.success) setFormError(res.error || "Registration failed");
    }
    setIsSubmitting(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !attachedFile) return;
    const msg = inputMessage.trim();
    const file = attachedFile ?? undefined;
    setInputMessage("");
    setAttachedFile(null);
    setShowAttachMenu(false);
    // When sending from the list view on mobile, switch to chat pane
    if (showConvList && activeConversation) setShowConvList(false);
    await sendMessage(msg, file);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAttachedFile(file);
    setShowAttachMenu(false);
    // Reset input value so the same file can be re-selected
    e.target.value = "";
  };

  const handleConvSelect = async (id: number) => {
    await selectConversation(id);
    setShowConvList(false);
  };

  const handleNewConversation = async () => {
    await createConversation();
    setShowConvList(false);
  };

  const handleRenameSubmit = async (id: number) => {
    if (renameValue.trim()) {
      await renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    await generatePrenatalPlan();
    setIsGenerating(false);
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.title || !newAppointment.appointment_date) return;
    const res = await createAppointment({
      type: newAppointment.type,
      title: newAppointment.title,
      appointment_date: newAppointment.appointment_date,
      appointment_time: newAppointment.appointment_time || undefined,
      location: newAppointment.location || undefined,
      doctor_name: newAppointment.doctor_name || undefined,
      notes: newAppointment.notes || undefined,
    });
    if (res.success) {
      setShowAddAppointment(false);
      setNewAppointment({
        type: "consultation",
        title: "",
        appointment_date: "",
        appointment_time: "",
        location: "",
        doctor_name: "",
        notes: "",
      });
    }
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightForm.weight_kg) return;
    setTrackingSubmitting("weight");
    await addWeight(
      parseFloat(weightForm.weight_kg),
      weightForm.note || undefined,
    );
    setWeightForm({ weight_kg: "", note: "" });
    setTrackingSubmitting(null);
  };

  const handleBpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpForm.systolic || !bpForm.diastolic) return;
    setTrackingSubmitting("bp");
    await addBP(
      parseInt(bpForm.systolic),
      parseInt(bpForm.diastolic),
      bpForm.note || undefined,
    );
    setBpForm({ systolic: "", diastolic: "", note: "" });
    setTrackingSubmitting(null);
  };

  const handleGlucoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glucoseForm.fasting_value) return;
    setTrackingSubmitting("glucose");
    await addGlucose(
      parseFloat(glucoseForm.fasting_value),
      glucoseForm.postprandial_value
        ? parseFloat(glucoseForm.postprandial_value)
        : undefined,
      glucoseForm.note || undefined,
    );
    setGlucoseForm({ fasting_value: "", postprandial_value: "", note: "" });
    setTrackingSubmitting(null);
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Heart className="w-10 h-10 text-pink-400 animate-pulse" />
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // ── Auth screen ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Top controls */}
          <div className="mb-4 flex items-center justify-between px-1">
            <LanguageSelector showLabel={false} />
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={
                theme === "light"
                  ? t("settings.switchToDark")
                  : t("settings.switchToLight")
              }
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>

          <Card className="border-border bg-card shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                🤰
              </div>
              <h1 className="text-2xl font-bold">{t("app.title")}</h1>
              <p className="text-primary-foreground/90 text-sm text-center">
                {t("app.description")}
              </p>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
              {/* Toggle Login / Register */}
              <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => {
                    setShowLoginForm(true);
                    setFormError(null);
                  }}
                  className={`flex-1 py-2 text-sm rounded transition-all ${
                    showLoginForm
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("auth.login")}
                </button>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setFormError(null);
                  }}
                  className={`flex-1 py-2 text-sm rounded transition-all ${
                    !showLoginForm
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("auth.register")}
                </button>
              </div>

              {/* Error message */}
              {(formError || authError) && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError || authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Register-only fields */}
                {!showLoginForm && (
                  <>
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("auth.name")}
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                          placeholder={t("auth.namePlaceholder")}
                        />
                      </div>
                    </div>

                    {/* LMP Date */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("auth.lmpDate")}
                      </label>
                      <input
                        type="date"
                        value={formData.lmpDate}
                        onChange={(e) =>
                          setFormData({ ...formData, lmpDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                        required
                      />
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("auth.email")}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                          placeholder={t("auth.emailPlaceholder")}
                        />
                      </div>
                    </div>

                    {/* Age + City row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t("auth.age")}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.age}
                          onChange={(e) =>
                            setFormData({ ...formData, age: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                          placeholder={t("auth.agePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t("auth.city")}
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                          placeholder={t("auth.cityPlaceholder")}
                        />
                      </div>
                    </div>

                    {/* Height */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("auth.height")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({ ...formData, height: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                        placeholder={t("auth.heightPlaceholder")}
                      />
                    </div>
                  </>
                )}

                {/* Phone — shared by login & register */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("auth.phone")}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                      placeholder={t("auth.phonePlaceholder")}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? showLoginForm
                      ? t("auth.loggingIn")
                      : t("auth.registering")
                    : showLoginForm
                      ? t("auth.signIn")
                      : t("auth.signUp")}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main App (logged in) ──────────────────────────────────────────────────
  const progressPct = dashboardData?.pregnancy?.progress_percentage
    ? Math.min(Math.round(dashboardData.pregnancy.progress_percentage), 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <NavigationDrawer
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isLoggedIn={isLoggedIn}
        onLogout={logout}
        userName={user?.name || user?.email || user?.phone}
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <MobileTopbar
          titleKey={`nav.${currentTab === "dashboard" ? "home" : currentTab}`}
          isDrawerOpen={isDrawerOpen}
          onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        />

        {/* Desktop Top Bar */}
        <header className="hidden md:flex sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md items-center justify-between h-16 px-6 lg:px-8">
          <h1 className="text-xl font-bold text-foreground">
            {t("app.title")}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={
                theme === "light"
                  ? t("settings.switchToDark")
                  : t("settings.switchToLight")
              }
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {(user?.name?.[0] ?? user?.phone?.[0] ?? "?").toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pt-20 md:pt-6 pb-24 md:pb-8 overflow-x-hidden">
          {/* ── Dashboard ───────────────────────────────────────────────── */}
          {currentTab === "dashboard" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("dashboard.welcome")}, {user?.name ?? "Maman"} 💕
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("app.description")}
                </p>
              </div>

              {dashLoading ? (
                <div className="flex justify-center py-16">
                  <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
                </div>
              ) : dashboardData?.gestational_age ? (
                <>
                  {/* Pregnancy Progress Card */}
                  <Card className="p-6 border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("dashboard.pregnancyProgress")}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          {t("dashboard.dueDate")}:{" "}
                          {formatDate(dashboardData?.pregnancy?.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {progressPct}%
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {t("dashboard.progress")}
                        </p>
                      </div>
                    </div>
                    <Progress value={progressPct} className="h-3" />

                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <div className="text-center p-2 bg-muted/50 rounded-xl min-w-0">
                        <p className="text-muted-foreground text-xs mb-1 leading-tight">
                          {t("dashboard.weeksPregnant")}
                        </p>
                        <p className="text-lg font-bold text-primary leading-tight">
                          {dashboardData.gestational_age.weeks}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">
                            SA+{dashboardData.gestational_age.days}j
                          </span>
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded-xl min-w-0">
                        <p className="text-muted-foreground text-xs mb-1 leading-tight">
                          {t("dashboard.trimester")}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {dashboardData?.pregnancy?.trimester}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded-xl min-w-0">
                        <p className="text-muted-foreground text-xs mb-1 leading-tight">
                          {t("profile.dueDate")}
                        </p>
                        <p className="text-xs font-semibold text-foreground leading-tight break-words">
                          {formatDate(dashboardData?.pregnancy?.due_date)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Baby Development */}
                  {dashboardData?.baby_development && (
                    <Card className="p-6 border-border">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Baby className="w-5 h-5 text-primary" />
                        {language === "fr"
                          ? "Développement de bébé"
                          : language === "ar"
                            ? "تطور الجنين"
                            : "Baby Development"}
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">
                          {dashboardData.baby_development.fruit}
                        </div>
                        <div className="grid grid-cols-2 gap-3 flex-1">
                          <div className="p-2 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground text-xs">
                              {language === "fr"
                                ? "Poids"
                                : language === "ar"
                                  ? "الوزن"
                                  : "Weight"}
                            </p>
                            <p className="font-bold text-foreground text-sm">
                              {dashboardData.baby_development.weight_g}g
                            </p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground text-xs">
                              {language === "fr"
                                ? "Taille"
                                : language === "ar"
                                  ? "الحجم"
                                  : "Size"}
                            </p>
                            <p className="font-bold text-foreground text-sm">
                              {dashboardData.baby_development.size_cm}cm
                            </p>
                          </div>
                        </div>
                      </div>
                      {dashboardData.baby_development.milestones?.length >
                        0 && (
                        <ul className="space-y-1.5">
                          {dashboardData.baby_development.milestones.map(
                            (m, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                {m}
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </Card>
                  )}

                  {/* Motivational Message */}
                  {dashboardData?.maternal_state?.motivational_message && (
                    <Card className="p-5 border-pink-200 dark:border-pink-800/50 bg-pink-50 dark:bg-pink-900/10">
                      <p className="text-foreground text-sm leading-relaxed font-medium">
                        💕 {dashboardData.maternal_state.motivational_message}
                      </p>
                    </Card>
                  )}

                  {/* Weekly Tip */}
                  {dashboardData?.maternal_state?.weekly_tip && (
                    <Card className="p-5 border-border">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {language === "fr"
                          ? "Conseil de la semaine"
                          : language === "ar"
                            ? "نصيحة الأسبوع"
                            : "Weekly Tip"}
                      </h3>
                      <p className="text-foreground text-sm leading-relaxed">
                        💡 {dashboardData.maternal_state.weekly_tip}
                      </p>
                    </Card>
                  )}

                  {/* Latest Vitals */}
                  {dashboardData?.latest_vitals && (
                    <Card className="p-6 border-border">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-primary" />
                        {language === "fr"
                          ? "Dernières mesures"
                          : language === "ar"
                            ? "آخر القياسات"
                            : "Latest Vitals"}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {dashboardData.latest_vitals.weight && (
                          <div className="p-3 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs mb-1">
                              {language === "fr"
                                ? "Poids"
                                : language === "ar"
                                  ? "الوزن"
                                  : "Weight"}
                            </p>
                            <p className="font-bold text-foreground">
                              {dashboardData.latest_vitals.weight.weight_kg} kg
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              SA{" "}
                              {
                                dashboardData.latest_vitals.weight
                                  .gestational_week
                              }
                            </p>
                          </div>
                        )}
                        {dashboardData.latest_vitals.blood_pressure && (
                          <div className="p-3 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs mb-1">
                              {language === "fr"
                                ? "Tension"
                                : language === "ar"
                                  ? "ضغط الدم"
                                  : "Blood Pressure"}
                            </p>
                            <p className="font-bold text-foreground">
                              {
                                dashboardData.latest_vitals.blood_pressure
                                  .display
                              }
                            </p>
                          </div>
                        )}
                        {dashboardData.latest_vitals.glucose && (
                          <div className="p-3 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs mb-1">
                              {language === "fr"
                                ? "Glycémie"
                                : language === "ar"
                                  ? "السكر"
                                  : "Glucose"}
                            </p>
                            <p className="font-bold text-foreground">
                              {
                                dashboardData.latest_vitals.glucose
                                  .fasting_value
                              }{" "}
                              g/L
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Next Appointment */}
                  <Card className="p-6 border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {t("dashboard.upcomingAppointments")}
                      </h3>
                      <button
                        onClick={() => setCurrentTab("calendar")}
                        className="text-primary text-sm hover:underline flex items-center gap-1"
                      >
                        {t("dashboard.viewAll")}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    {dashboardData?.next_appointment ? (
                      <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {dashboardData.next_appointment.title}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {formatDate(
                              dashboardData.next_appointment.appointment_date,
                            )}
                            {dashboardData.next_appointment.appointment_time
                              ? ` • ${dashboardData.next_appointment.appointment_time}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dashboardData.next_appointment.status)}`}
                        >
                          {getStatusLabel(
                            dashboardData.next_appointment.status,
                            t,
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {t("dashboard.noAppointments")}
                      </p>
                    )}
                  </Card>

                  {/* Active Alerts */}
                  {dashboardData?.active_alerts &&
                    dashboardData.active_alerts.length > 0 && (
                      <Card className="p-6 border-border">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                          <Bell className="w-5 h-5 text-primary" />
                          {t("dashboard.recentAlerts")}
                        </h3>
                        <div className="space-y-3">
                          {dashboardData.active_alerts
                            .slice(0, 3)
                            .map((alert) => (
                              <div
                                key={alert.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                              >
                                <AlertCircle
                                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${getSeverityIconColor(alert.severity)}`}
                                />
                                <div>
                                  <p className="font-medium text-foreground text-sm">
                                    {alert.title}
                                  </p>
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    {alert.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </Card>
                    )}
                </>
              ) : (
                <Card className="p-8 text-center border-border">
                  <Baby className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {t("dashboard.noData")}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ── Calendar ────────────────────────────────────────────────── */}
          {currentTab === "calendar" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-foreground">
                  {t("calendar.title")}
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddAppointment(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {language === "fr"
                      ? "Ajouter"
                      : language === "ar"
                        ? "إضافة"
                        : "Add"}
                  </Button>
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
                    />
                    {isGenerating
                      ? t("calendar.generating")
                      : t("calendar.generatePlan")}
                  </Button>
                </div>
              </div>

              {/* Add Appointment Modal */}
              {showAddAppointment && (
                <Card className="p-6 border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {language === "fr"
                        ? "Nouveau rendez-vous"
                        : language === "ar"
                          ? "موعد جديد"
                          : "New Appointment"}
                    </h3>
                    <button
                      onClick={() => setShowAddAppointment(false)}
                      className="p-1.5 hover:bg-muted rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddAppointment} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {language === "fr"
                            ? "Type"
                            : language === "ar"
                              ? "النوع"
                              : "Type"}
                        </label>
                        <select
                          value={newAppointment.type}
                          onChange={(e) =>
                            setNewAppointment({
                              ...newAppointment,
                              type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="consultation">Consultation</option>
                          <option value="echographie">Échographie</option>
                          <option value="analyse">Analyse</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {language === "fr"
                            ? "Date *"
                            : language === "ar"
                              ? "التاريخ *"
                              : "Date *"}
                        </label>
                        <input
                          type="date"
                          required
                          value={newAppointment.appointment_date}
                          onChange={(e) =>
                            setNewAppointment({
                              ...newAppointment,
                              appointment_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Titre *"
                          : language === "ar"
                            ? "العنوان *"
                            : "Title *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAppointment.title}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={
                          language === "fr"
                            ? "Ex: Échographie morphologique"
                            : ""
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {language === "fr"
                            ? "Heure"
                            : language === "ar"
                              ? "الوقت"
                              : "Time"}
                        </label>
                        <input
                          type="time"
                          value={newAppointment.appointment_time}
                          onChange={(e) =>
                            setNewAppointment({
                              ...newAppointment,
                              appointment_time: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {language === "fr"
                            ? "Médecin"
                            : language === "ar"
                              ? "الطبيب"
                              : "Doctor"}
                        </label>
                        <input
                          type="text"
                          value={newAppointment.doctor_name}
                          onChange={(e) =>
                            setNewAppointment({
                              ...newAppointment,
                              doctor_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Lieu"
                          : language === "ar"
                            ? "المكان"
                            : "Location"}
                      </label>
                      <input
                        type="text"
                        value={newAppointment.location}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Notes"
                          : language === "ar"
                            ? "ملاحظات"
                            : "Notes"}
                      </label>
                      <textarea
                        rows={2}
                        value={newAppointment.notes}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" size="sm" className="flex-1">
                        {language === "fr"
                          ? "Enregistrer"
                          : language === "ar"
                            ? "حفظ"
                            : "Save"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddAppointment(false)}
                        className="flex-1"
                      >
                        {language === "fr"
                          ? "Annuler"
                          : language === "ar"
                            ? "إلغاء"
                            : "Cancel"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {aptsLoading ? (
                <div className="flex justify-center py-12">
                  <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((apt, aptIdx) => (
                    <Card
                      key={apt.id != null ? apt.id : `apt-${aptIdx}`}
                      className="p-5 border-border flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {apt.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {formatDate(apt.appointment_date)}
                            {apt.appointment_time
                              ? ` • ${apt.appointment_time}`
                              : ""}
                          </p>
                          {apt.doctor_name && (
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {t("calendar.doctor")}: {apt.doctor_name}
                            </p>
                          )}
                          {apt.location && (
                            <p className="text-muted-foreground text-xs">
                              📍 {apt.location}
                            </p>
                          )}
                          {apt.notes && (
                            <p className="text-muted-foreground text-xs italic mt-1">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(apt.status)}`}
                      >
                        {getStatusLabel(apt.status, t)}
                      </span>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-border">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {t("calendar.noAppointments")}
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {t("calendar.generatePlan")} →
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ── Chat ────────────────────────────────────────────────────── */}
          {currentTab === "chat" && (
            /* Hidden file inputs – triggered programmatically */
            <>
              {/* Camera (mobile: direct camera capture) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelected}
              />
              {/* Gallery (images only) */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              {/* Document / any file */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
                className="hidden"
                onChange={handleFileSelected}
              />

              <div className="max-w-5xl mx-auto h-full flex flex-col">
                {/* Page title – visible on desktop, hidden on mobile inside panels */}
                <div className="mb-3 hidden sm:block">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t("nav.chat")}
                  </h2>
                </div>

                {/* Two-panel layout */}
                <div className="flex gap-3 flex-1 min-h-0">
                  {/* ── Conversations sidebar ──────────────────────────── */}
                  <div
                    className={`
                      flex-col w-full sm:w-72 sm:flex-shrink-0
                      bg-card border border-border rounded-2xl overflow-hidden
                      ${
                        /* On mobile: show ONLY the list panel OR only the chat panel */
                        showConvList ? "flex" : "hidden sm:flex"
                      }
                    `}
                  >
                    {/* Sidebar header */}
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <span className="font-semibold text-sm text-foreground">
                        {language === "fr"
                          ? "Conversations"
                          : language === "ar"
                            ? "المحادثات"
                            : "Conversations"}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full"
                        onClick={handleNewConversation}
                        title={
                          language === "fr"
                            ? "Nouvelle conversation"
                            : language === "ar"
                              ? "محادثة جديدة"
                              : "New conversation"
                        }
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto">
                      {isLoadingConversations ? (
                        <div className="flex justify-center items-center py-10">
                          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
                          <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm">
                            {language === "fr"
                              ? "Aucune conversation. Commencez à discuter !"
                              : language === "ar"
                                ? "لا توجد محادثات. ابدئي المحادثة!"
                                : "No conversations yet. Start chatting!"}
                          </p>
                          <Button
                            size="sm"
                            className="mt-4"
                            onClick={handleNewConversation}
                          >
                            <MessageSquarePlus className="w-4 h-4 mr-1" />
                            {language === "fr"
                              ? "Nouvelle"
                              : language === "ar"
                                ? "جديدة"
                                : "New chat"}
                          </Button>
                        </div>
                      ) : (
                        <ul className="divide-y divide-border">
                          {conversations.map((conv) => (
                            <li
                              key={conv.id}
                              className={`group relative flex items-center px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${
                                activeConversation?.id === conv.id
                                  ? "bg-primary/10 border-l-2 border-primary"
                                  : ""
                              }`}
                              onClick={() => {
                                if (renamingId !== conv.id) {
                                  handleConvSelect(conv.id);
                                }
                              }}
                            >
                              {renamingId === conv.id ? (
                                /* Inline rename input */
                                <form
                                  className="flex-1 flex gap-1"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRenameSubmit(conv.id);
                                  }}
                                >
                                  <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) =>
                                      setRenameValue(e.target.value)
                                    }
                                    onBlur={() => handleRenameSubmit(conv.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") {
                                        setRenamingId(null);
                                        setRenameValue("");
                                      }
                                    }}
                                    className="flex-1 text-sm bg-input border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    type="submit"
                                    className="text-xs text-primary font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    ✓
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-foreground truncate pr-1">
                                    {conv.title}
                                  </span>
                                  {/* Edit & Delete buttons */}
                                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                                    <button
                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                      title="Rename"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRenamingId(conv.id);
                                        setRenameValue(conv.title);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                      title="Delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteConversation(conv.id);
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* ── Chat / messages pane ──────────────────────────── */}
                  <div
                    className={`
                      flex-1 flex flex-col min-h-0
                      ${!showConvList ? "flex" : "hidden sm:flex"}
                    `}
                  >
                    {/* Chat pane header (mobile: back button + title) */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        className="sm:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                        onClick={() => setShowConvList(true)}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="font-semibold text-foreground truncate flex-1 sm:text-2xl sm:font-bold">
                        {activeConversation
                          ? activeConversation.title
                          : t("nav.chat")}
                      </h2>
                    </div>

                    {/* Messages area */}
                    <div className="flex-1 bg-card border border-border rounded-2xl p-4 sm:p-5 mb-3 overflow-y-auto space-y-4 min-h-[300px] max-h-[55vh]">
                      {isLoadingMessages ? (
                        <div className="flex justify-center items-center py-10">
                          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Heart className="w-12 h-12 mx-auto mb-4 text-pink-400" />
                          <p className="font-medium">
                            {language === "fr"
                              ? "Bonjour ! Je suis là pour vous accompagner."
                              : language === "ar"
                                ? "مرحبا! أنا هنا لمساعدتك."
                                : "Hello! I am here to support you."}
                          </p>
                          <p className="text-sm mt-2">
                            {language === "fr"
                              ? "Posez-moi n'importe quelle question..."
                              : language === "ar"
                                ? "اسأليني أي شيء..."
                                : "Ask me anything..."}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg, index) => (
                          <div
                            key={msg.id ?? index}
                            className={`flex ${
                              msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-primary text-primary-foreground whitespace-pre-wrap">
                                {msg.content}
                              </div>
                            ) : (
                              <div className="max-w-[90%] text-foreground text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                                {msg.content ? (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                  </ReactMarkdown>
                                ) : (
                                  <span className="flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      {isStreaming &&
                        messages[messages.length - 1]?.role !== "assistant" && (
                          <div className="flex justify-start">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                          </div>
                        )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Attachment preview badge */}
                    {attachedFile && (
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 text-sm text-primary">
                          {attachedFile.type.startsWith("image/") ? (
                            <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]">
                            {attachedFile.name}
                          </span>
                          <button
                            onClick={() => setAttachedFile(null)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Input row */}
                    <div className="relative flex gap-2 items-end">
                      {/* Attach button + popup */}
                      <div className="relative flex-shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full w-11 h-11"
                          onClick={() => setShowAttachMenu((v) => !v)}
                          disabled={isStreaming}
                          title={
                            language === "fr"
                              ? "Joindre un fichier"
                              : language === "ar"
                                ? "إرفاق ملف"
                                : "Attach file"
                          }
                        >
                          <Paperclip className="w-4.5 h-4.5" />
                        </Button>

                        {/* Attach menu popup */}
                        {showAttachMenu && (
                          <div className="absolute bottom-14 left-0 z-50 bg-popover border border-border rounded-2xl shadow-lg p-2 flex flex-col gap-1 min-w-[180px]">
                            {/* Camera – available on mobile, acts as camera shortcut */}
                            <button
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted text-sm text-foreground transition-colors"
                              onClick={() => cameraInputRef.current?.click()}
                            >
                              <Camera className="w-4 h-4 text-pink-500" />
                              <span>
                                {language === "fr"
                                  ? "Prendre une photo"
                                  : language === "ar"
                                    ? "التقاط صورة"
                                    : "Take a photo"}
                              </span>
                            </button>
                            {/* Gallery */}
                            <button
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted text-sm text-foreground transition-colors"
                              onClick={() => galleryInputRef.current?.click()}
                            >
                              <ImageIcon className="w-4 h-4 text-blue-500" />
                              <span>
                                {language === "fr"
                                  ? "Choisir une photo"
                                  : language === "ar"
                                    ? "اختيار صورة"
                                    : "Choose photo"}
                              </span>
                            </button>
                            {/* Document */}
                            <button
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted text-sm text-foreground transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <FileText className="w-4 h-4 text-amber-500" />
                              <span>
                                {language === "fr"
                                  ? "Choisir un document"
                                  : language === "ar"
                                    ? "اختيار مستند"
                                    : "Choose document"}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Text input */}
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          handleSendMessage()
                        }
                        placeholder={
                          language === "fr"
                            ? "Posez votre question..."
                            : language === "ar"
                              ? "اكتبي سؤالك..."
                              : "Type your question..."
                        }
                        className="flex-1 bg-input border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        disabled={isStreaming}
                      />

                      {/* Send */}
                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          (!inputMessage.trim() && !attachedFile) || isStreaming
                        }
                        size="icon"
                        className="rounded-full w-11 h-11 flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Tracking ────────────────────────────────────────────────── */}
          {currentTab === "tracking" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("tracking.title")}
              </h2>

              {/* Weight Card */}
              <Card className="p-6 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  {t("tracking.weight")}
                </h3>

                {latestWeight && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {language === "fr"
                        ? "Dernière mesure"
                        : language === "ar"
                          ? "آخر قياس"
                          : "Latest"}
                    </span>
                    <span className="font-bold text-foreground">
                      {latestWeight.weight_kg} kg
                    </span>
                  </div>
                )}

                <form onSubmit={handleWeightSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Poids (kg) *"
                          : language === "ar"
                            ? "الوزن (كغ) *"
                            : "Weight (kg) *"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={weightForm.weight_kg}
                        onChange={(e) =>
                          setWeightForm({
                            ...weightForm,
                            weight_kg: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="65.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Note"
                          : language === "ar"
                            ? "ملاحظة"
                            : "Note"}
                      </label>
                      <input
                        type="text"
                        value={weightForm.note}
                        onChange={(e) =>
                          setWeightForm({ ...weightForm, note: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={
                          language === "fr" ? "Optionnel" : "Optional"
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={trackingSubmitting === "weight" || weightLoading}
                    className="w-full"
                  >
                    {trackingSubmitting === "weight"
                      ? language === "fr"
                        ? "Enregistrement..."
                        : "Saving..."
                      : language === "fr"
                        ? "Enregistrer"
                        : language === "ar"
                          ? "حفظ"
                          : "Save"}
                  </Button>
                </form>

                {weightMeasurements.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === "fr"
                        ? "Historique"
                        : language === "ar"
                          ? "السجل"
                          : "History"}
                    </p>
                    {weightMeasurements
                      .slice(-5)
                      .reverse()
                      .map((m, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm py-1 border-b border-border last:border-0"
                        >
                          <span className="text-muted-foreground">
                            {m.measured_at
                              ? formatDate(m.measured_at)
                              : `SA ${m.gestational_week ?? "—"}`}
                          </span>
                          <span className="font-medium text-foreground">
                            {m.weight_kg} kg
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </Card>

              {/* Blood Pressure Card */}
              <Card className="p-6 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  {t("tracking.bloodPressure")}
                </h3>

                {latestBP && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {language === "fr"
                        ? "Dernière mesure"
                        : language === "ar"
                          ? "آخر قياس"
                          : "Latest"}
                    </span>
                    <span className="font-bold text-foreground">
                      {latestBP.display ??
                        `${latestBP.systolic}/${latestBP.diastolic}`}{" "}
                      mmHg
                    </span>
                  </div>
                )}

                <form onSubmit={handleBpSubmit} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr" ? "Systolique *" : "Systolic *"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bpForm.systolic}
                        onChange={(e) =>
                          setBpForm({ ...bpForm, systolic: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr" ? "Diastolique *" : "Diastolic *"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bpForm.diastolic}
                        onChange={(e) =>
                          setBpForm({ ...bpForm, diastolic: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Note"
                          : language === "ar"
                            ? "ملاحظة"
                            : "Note"}
                      </label>
                      <input
                        type="text"
                        value={bpForm.note}
                        onChange={(e) =>
                          setBpForm({ ...bpForm, note: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={
                          language === "fr" ? "Optionnel" : "Optional"
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={trackingSubmitting === "bp" || bpLoading}
                    className="w-full"
                  >
                    {trackingSubmitting === "bp"
                      ? language === "fr"
                        ? "Enregistrement..."
                        : "Saving..."
                      : language === "fr"
                        ? "Enregistrer"
                        : language === "ar"
                          ? "حفظ"
                          : "Save"}
                  </Button>
                </form>

                {bpMeasurements.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === "fr"
                        ? "Historique"
                        : language === "ar"
                          ? "السجل"
                          : "History"}
                    </p>
                    {bpMeasurements
                      .slice(-5)
                      .reverse()
                      .map((m, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm py-1 border-b border-border last:border-0"
                        >
                          <span className="text-muted-foreground">
                            {m.measured_at
                              ? formatDate(m.measured_at)
                              : `SA ${m.gestational_week ?? "—"}`}
                          </span>
                          <span className="font-medium text-foreground">
                            {m.display ?? `${m.systolic}/${m.diastolic}`} mmHg
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </Card>

              {/* Glucose Card */}
              <Card className="p-6 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  {t("tracking.glucose")}
                </h3>

                {latestGlucose && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {language === "fr"
                        ? "Dernière mesure"
                        : language === "ar"
                          ? "آخر قياس"
                          : "Latest"}
                    </span>
                    <span className="font-bold text-foreground">
                      {latestGlucose.fasting_value} g/L
                      {latestGlucose.postprandial_value
                        ? ` / ${latestGlucose.postprandial_value} g/L`
                        : ""}
                    </span>
                  </div>
                )}

                <form onSubmit={handleGlucoseSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "À jeun (g/L) *"
                          : language === "ar"
                            ? "صائم (غ/ل) *"
                            : "Fasting (g/L) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={glucoseForm.fasting_value}
                        onChange={(e) =>
                          setGlucoseForm({
                            ...glucoseForm,
                            fasting_value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.90"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {language === "fr"
                          ? "Post-prandial (g/L)"
                          : language === "ar"
                            ? "بعد الأكل (غ/ل)"
                            : "Postprandial (g/L)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={glucoseForm.postprandial_value}
                        onChange={(e) =>
                          setGlucoseForm({
                            ...glucoseForm,
                            postprandial_value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="1.20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {language === "fr"
                        ? "Note"
                        : language === "ar"
                          ? "ملاحظة"
                          : "Note"}
                    </label>
                    <input
                      type="text"
                      value={glucoseForm.note}
                      onChange={(e) =>
                        setGlucoseForm({ ...glucoseForm, note: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={language === "fr" ? "Optionnel" : "Optional"}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      trackingSubmitting === "glucose" || glucoseLoading
                    }
                    className="w-full"
                  >
                    {trackingSubmitting === "glucose"
                      ? language === "fr"
                        ? "Enregistrement..."
                        : "Saving..."
                      : language === "fr"
                        ? "Enregistrer"
                        : language === "ar"
                          ? "حفظ"
                          : "Save"}
                  </Button>
                </form>

                {glucoseMeasurements.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === "fr"
                        ? "Historique"
                        : language === "ar"
                          ? "السجل"
                          : "History"}
                    </p>
                    {glucoseMeasurements
                      .slice(-5)
                      .reverse()
                      .map((m, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm py-1 border-b border-border last:border-0"
                        >
                          <span className="text-muted-foreground">
                            {m.measured_at
                              ? formatDate(m.measured_at)
                              : `SA ${m.gestational_week ?? "—"}`}
                          </span>
                          <span className="font-medium text-foreground">
                            {m.fasting_value} g/L
                            {m.postprandial_value
                              ? ` / ${m.postprandial_value}`
                              : ""}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </Card>

              {/* Fetal Movements Card — only after 28 SA */}
              {gestationalWeeks >= 28 ? (
                <Card className="p-6 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-purple-500" />
                    {t("tracking.fetalMovements")}
                  </h3>

                  {openSession ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 text-center">
                        <p className="text-purple-700 dark:text-purple-300 text-sm font-medium mb-1">
                          {language === "fr"
                            ? "Session en cours"
                            : language === "ar"
                              ? "جلسة نشطة"
                              : "Active Session"}
                        </p>
                        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                          {openSession.count}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {language === "fr"
                            ? "mouvements"
                            : language === "ar"
                              ? "حركة"
                              : "movements"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() =>
                            openSession.id && incrementMovement(openSession.id)
                          }
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          +1{" "}
                          {language === "fr"
                            ? "mouvement"
                            : language === "ar"
                              ? "حركة"
                              : "movement"}
                        </Button>
                        <Button
                          onClick={() =>
                            openSession.id && endSession(openSession.id)
                          }
                          variant="outline"
                          className="flex-1"
                        >
                          {language === "fr"
                            ? "Terminer"
                            : language === "ar"
                              ? "إنهاء"
                              : "End"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm mb-4">
                        {language === "fr"
                          ? "Comptez les mouvements de bébé pendant 2 heures"
                          : language === "ar"
                            ? "عدّي حركات الجنين لمدة ساعتين"
                            : "Count baby movements for 2 hours"}
                      </p>
                      <Button
                        onClick={startSession}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {language === "fr"
                          ? "Démarrer une session"
                          : language === "ar"
                            ? "بدء الجلسة"
                            : "Start Session"}
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-6 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-purple-500" />
                    {t("tracking.fetalMovements")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {language === "fr"
                      ? `Disponible à partir de 28 SA (actuellement ${gestationalWeeks} SA)`
                      : language === "ar"
                        ? `متاح من الأسبوع 28 (حالياً ${gestationalWeeks})`
                        : `Available from 28 weeks (currently ${gestationalWeeks} weeks)`}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ── Alerts ──────────────────────────────────────────────────── */}
          {currentTab === "alerts" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("alerts.title")}
              </h2>

              {alertsLoading ? (
                <div className="flex justify-center py-12">
                  <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert: BackendAlert) => (
                    <Card
                      key={alert.id}
                      className={`p-5 border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getSeverityIconColor(alert.severity)}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground">
                              {alert.title}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadge(alert.severity)}`}
                            >
                              {alert.severity}
                            </span>
                            {alert.category && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                {alert.category}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-0.5">
                            {alert.message}
                          </p>
                          {alert.created_at && (
                            <p className="text-muted-foreground text-xs mt-1">
                              {formatDate(alert.created_at)}
                            </p>
                          )}
                        </div>
                        {alert.is_active && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            title={t("alerts.resolve")}
                          >
                            <X className="w-4 h-4 text-foreground/60" />
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-border">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-foreground">
                    {t("alerts.allGood")}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("alerts.noAlerts")}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ── Advice ──────────────────────────────────────────────────── */}
          {currentTab === "advice" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("advice.title")}
              </h2>

              {tipsLoading ? (
                <div className="flex justify-center py-12">
                  <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {tipsData?.categories
                    ? Object.entries(tipsData.categories).map(([key, cat]) => (
                        <Card key={key} className="p-6 border-border">
                          <h3 className="text-lg font-bold text-foreground mb-4">
                            {CATEGORY_ICON[key] ?? "💡"} {cat.title}
                          </h3>
                          {cat.description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {cat.description}
                            </p>
                          )}
                          <ul className="space-y-2">
                            {cat.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">
                                  {tip}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ))
                    : FALLBACK_TIPS.map((cat) => (
                        <Card key={cat.key} className="p-6 border-border">
                          <h3 className="text-lg font-bold text-foreground mb-4">
                            {cat.icon} {t(cat.titleKey)}
                          </h3>
                          <ul className="space-y-2">
                            {(
                              cat.tips[language as keyof typeof cat.tips] ??
                              cat.tips.en
                            ).map((tip, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">
                                  {tip}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile ─────────────────────────────────────────────────── */}
          {currentTab === "profile" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("profile.title")}
              </h2>

              {/* User Info */}
              <Card className="p-6 border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {(user?.name?.[0] ?? user?.phone?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {user?.name ?? user?.phone ?? "—"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {user?.email ?? user?.phone}
                    </p>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t("profile.personalInfo")}
                </h4>
                <div className="space-y-3">
                  {[
                    { label: t("profile.phone"), value: user?.phone },
                    { label: t("auth.name"), value: user?.name },
                    { label: t("profile.email"), value: user?.email },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-muted-foreground text-sm">
                        {label}
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Pregnancy Info */}
              <Card className="p-6 border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t("profile.pregnancy")}
                </h4>
                {user?.ddr || user?.dpa || user?.gestationalAge ? (
                  <div className="space-y-3">
                    {[
                      {
                        label: t("auth.lmpDate"),
                        value: formatDate(user?.ddr),
                      },
                      {
                        label: t("profile.dueDate"),
                        value: formatDate(user?.dpa),
                      },
                      {
                        label: t("profile.weeksPregnant"),
                        value:
                          user?.gestationalAge != null
                            ? `${user.gestationalAge} ${language === "ar" ? "أسبوع" : language === "fr" ? "semaines" : "weeks"}`
                            : null,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-muted-foreground text-sm">
                          {label}
                        </span>
                        <span className="text-foreground text-sm font-medium">
                          {value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("profile.noPregnancy")}
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* ── Settings ────────────────────────────────────────────────── */}
          {currentTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("settings.title")}
              </h2>

              {/* Appearance */}
              <Card className="p-6 border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("settings.theme")} & {t("settings.language")}
                </h3>
                <div className="space-y-4">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {t("settings.theme")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {theme === "light"
                          ? t("settings.lightMode")
                          : t("settings.darkMode")}
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        theme === "dark" ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform flex items-center justify-center ${
                          theme === "dark" ? "translate-x-7" : "translate-x-0"
                        }`}
                      >
                        {theme === "dark" ? (
                          <Moon className="w-3 h-3 text-primary" />
                        ) : (
                          <Sun className="w-3 h-3 text-yellow-500" />
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Language Picker */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {t("settings.language")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {language === "fr"
                          ? "Français"
                          : language === "en"
                            ? "English"
                            : "العربية"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(
                        [
                          { code: "fr" as Language, label: "FR", flag: "🇫🇷" },
                          { code: "en" as Language, label: "EN", flag: "🇬🇧" },
                          { code: "ar" as Language, label: "عر", flag: "🇹🇳" },
                        ] as const
                      ).map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            language === lang.code
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {lang.flag} {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notifications */}
              <Card className="p-6 border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("settings.notifications")}
                </h3>
                <div className="space-y-3">
                  {/* Master toggle */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">
                        {t("settings.notifications")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t("settings.notificationsDesc")}
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={settings?.notifications_enabled ?? false}
                      onClick={() =>
                        updateSettings({
                          notifications_enabled: !(
                            settings?.notifications_enabled ?? false
                          ),
                        })
                      }
                      className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        settings?.notifications_enabled
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                          settings?.notifications_enabled
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reminder toggles */}
                  {(
                    [
                      {
                        key: "reminder_7_days" as const,
                        label:
                          language === "fr"
                            ? "7 jours avant"
                            : language === "ar"
                              ? "قبل 7 أيام"
                              : "7 days before",
                      },
                      {
                        key: "reminder_3_days" as const,
                        label:
                          language === "fr"
                            ? "3 jours avant"
                            : language === "ar"
                              ? "قبل 3 أيام"
                              : "3 days before",
                      },
                      {
                        key: "reminder_same_day" as const,
                        label:
                          language === "fr"
                            ? "Le jour même"
                            : language === "ar"
                              ? "في نفس اليوم"
                              : "Same day",
                      },
                      {
                        key: "reminder_2_hours" as const,
                        label:
                          language === "fr"
                            ? "2 heures avant"
                            : language === "ar"
                              ? "قبل ساعتين"
                              : "2 hours before",
                      },
                    ] as const
                  ).map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <p className="text-foreground text-sm">{label}</p>
                      <button
                        role="switch"
                        aria-checked={settings?.[key] ?? false}
                        onClick={() =>
                          updateSettings({ [key]: !(settings?.[key] ?? false) })
                        }
                        disabled={!settings?.notifications_enabled}
                        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40 ${
                          settings?.[key] ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            settings?.[key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Account */}
              <Card className="p-6 border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("settings.account")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">
                        {user?.name ?? user?.phone}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {user?.email ?? user?.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab("profile")}
                      className="text-primary text-sm hover:underline flex items-center gap-1"
                    >
                      {t("common.edit")} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {t("settings.privacy")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t("settings.dataPrivacy")}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </Card>

              {/* Sign Out */}
              <Button
                onClick={logout}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t("settings.logout")}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navbar - Mobile */}
      <BottomNavbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}
