const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Shared response envelope
// ---------------------------------------------------------------------------
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Auth / User / Profile / Pregnancy interfaces
// ---------------------------------------------------------------------------

/** Shape returned by user.to_dict() on the backend */
export interface BackendUser {
  id: string | number;
  phone?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Shape returned by profile.to_dict() on the backend */
export interface BackendProfile {
  id?: string | number;
  user_id?: string | number;
  name?: string;
  email?: string;
  age?: number;
  city?: string;
  height_cm?: number;
  preferred_language?: string;
  theme?: string;
  created_at?: string;
  updated_at?: string;
}

/** Shape returned by pregnancy_profile.to_dict() on the backend */
export interface BackendPregnancy {
  id?: string | number;
  user_id?: string | number;
  lmp_date?: string;
  due_date?: string;
  gestational_weeks?: number;
  gestational_days?: number;
  trimester?: number;
  progress_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

/** Normalised user object used throughout the frontend */
export interface User {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  /** Last Menstrual Period date (lmp_date) */
  ddr?: string;
  /** Due date */
  dpa?: string;
  gestationalAge?: number;
}

export interface Profile {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  phone?: string;
}

export interface Pregnancy {
  id: string | number;
  start_date: string;
  due_date: string;
  weeks_pregnant: number;
  trimester: number;
}

// ---------------------------------------------------------------------------
// Appointment
// ---------------------------------------------------------------------------

/** Appointment as returned by GET /appointments */
export interface BackendAppointment {
  id: number;
  type: string; // "consultation" | "analyse" | "echographie"
  title: string;
  appointment_date: string;
  appointment_time?: string | null;
  location?: string | null;
  doctor_name?: string | null;
  notes?: string | null;
  source: string; // "auto" | "manual"
  status: string; // "planned" | "done" | "missed" | "postponed" | "cancelled"
  gestational_week_target?: number | null;
  followup?: {
    was_completed: boolean;
    outcome_type?: string;
    comment?: string;
    completed_at?: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

/** Alert as returned by GET /alerts */
export interface BackendAlert {
  id: number;
  category: string; // "blood_pressure" | "glucose" | "weight" | "fetal_movement" | "followup" | "system"
  severity: string; // "info" | "warning" | "urgent"
  title: string;
  message: string;
  source_table?: string;
  source_id?: number;
  is_active: boolean;
  created_at: string;
  resolved_at?: string | null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardData {
  gestational_age?: {
    weeks: number;
    days: number;
    display: string;
    total_days: number;
  };
  pregnancy?: {
    lmp_date: string;
    due_date: string;
    trimester: number;
    progress_percentage: number;
  };
  baby_development?: {
    week: number;
    reference_week: number;
    size_cm: number;
    weight_g: number;
    fruit: string;
    milestones: string[];
  };
  maternal_state?: {
    symptoms: string[];
    normal_note: string;
    motivational_message: string;
    weekly_tip: string;
  };
  latest_vitals?: {
    weight: {
      weight_kg: number;
      gestational_week: number;
      measured_at: string;
    } | null;
    blood_pressure: {
      systolic: number;
      diastolic: number;
      display: string;
    } | null;
    glucose: {
      fasting_value: number;
      postprandial_value: number | null;
    } | null;
  };
  next_appointment?: BackendAppointment | null;
  active_alerts?: BackendAlert[];
  summary?: { active_alerts_count: number; has_next_appointment: boolean };
}

// ---------------------------------------------------------------------------
// Vitals
// ---------------------------------------------------------------------------

export interface WeightMeasurement {
  id?: number;
  weight_kg: number;
  gestational_week?: number;
  note?: string;
  measured_at?: string;
}

export interface BloodPressureMeasurement {
  id?: number;
  systolic: number;
  diastolic: number;
  display?: string;
  gestational_week?: number;
  note?: string;
  measured_at?: string;
}

export interface GlucoseMeasurement {
  id?: number;
  fasting_value: number;
  postprandial_value?: number | null;
  gestational_week?: number;
  note?: string;
  measured_at?: string;
}

export interface FetalMovementSession {
  id?: number;
  count: number;
  session_start: string;
  session_end?: string | null;
  duration_minutes?: number;
  note?: string;
  gestational_week?: number;
}

// ---------------------------------------------------------------------------
// Chat Conversations
// ---------------------------------------------------------------------------

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ConversationMessage[];
}

export interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  attachment_name: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface UserSettings {
  id?: number;
  user_id?: number;
  notifications_enabled: boolean;
  reminder_7_days: boolean;
  reminder_3_days: boolean;
  reminder_same_day: boolean;
  reminder_2_hours: boolean;
}

// ---------------------------------------------------------------------------
// Tips
// ---------------------------------------------------------------------------

export interface TipCategory {
  title: string;
  description?: string;
  tips: string[];
}

export interface TipsResponse {
  trimester: number;
  categories: Record<string, TipCategory>;
}

// ---------------------------------------------------------------------------
// ApiClient
// ---------------------------------------------------------------------------
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_URL;
    this.loadToken();
  }

  // ---- Token management ---------------------------------------------------

  private loadToken() {
    if (typeof window === "undefined") return;

    // Primary key used by this version
    const primary = localStorage.getItem("access_token");
    if (primary) {
      this.token = primary;
      return;
    }

    // Migrate legacy key written by previous versions
    const legacy = localStorage.getItem("auth_token");
    if (legacy) {
      this.token = legacy;
      localStorage.setItem("access_token", legacy);
      localStorage.removeItem("auth_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("auth_token"); // remove legacy key too
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ---- Headers ------------------------------------------------------------

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // ---- Generic fetch wrapper ----------------------------------------------

  async request<T = any>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        const msg = json?.error || json?.message || `HTTP ${res.status}`;
        return { success: false, error: msg, message: msg };
      }

      // If the server already returns {success, data} pass it through,
      // otherwise wrap it so callers always get a consistent envelope.
      if (
        json !== null &&
        typeof json === "object" &&
        ("success" in json || "data" in json)
      ) {
        return json as ApiResponse<T>;
      }

      return { success: true, data: json as T };
    } catch (err: any) {
      const msg = err?.message || "Network error";
      console.error(`[ApiClient] ${method} ${endpoint}:`, msg);
      return { success: false, error: msg, message: msg };
    }
  }

  // ---- Auth ---------------------------------------------------------------

  /**
   * Register a new user.
   * Response data shape: { access_token, user, profile, pregnancy_profile, ... }
   */
  async register(
    phone: string,
    password: string,
    lmpDate: string,
    name?: string,
    email?: string,
    age?: number,
    city?: string,
    heightCm?: number,
  ): Promise<
    ApiResponse<{
      access_token: string;
      user: BackendUser;
      profile: BackendProfile;
      pregnancy_profile: BackendPregnancy;
      message?: string;
    }>
  > {
    const payload: Record<string, any> = { phone, password, lmp_date: lmpDate };
    if (name) payload.name = name;
    if (email) payload.email = email;
    if (age) payload.age = age;
    if (city) payload.city = city;
    if (heightCm) payload.height_cm = heightCm;

    const response = await this.request("POST", "/auth/register", payload);
    const token = response?.data?.access_token;
    if (response.success && token) this.setToken(token);
    return response;
  }

  /**
   * Login with phone + password.
   * Response data shape: { access_token, user, profile, pregnancy_profile }
   */
  async login(
    phone: string,
    password: string,
  ): Promise<
    ApiResponse<{
      access_token: string;
      user: BackendUser;
      profile: BackendProfile;
      pregnancy_profile: BackendPregnancy;
      message?: string;
    }>
  > {
    const response = await this.request("POST", "/auth/login", {
      phone,
      password,
    });
    const token = response?.data?.access_token;
    if (response.success && token) this.setToken(token);
    return response;
  }

  /**
   * Get current authenticated user data.
   * Response data shape: { user, profile, pregnancy_profile }
   */
  async getMe(): Promise<
    ApiResponse<{
      user: BackendUser;
      profile: BackendProfile | null;
      pregnancy_profile: BackendPregnancy | null;
    }>
  > {
    return this.request("GET", "/auth/me");
  }

  async logout(): Promise<ApiResponse<void>> {
    this.clearToken();
    return { success: true };
  }

  /** Change the authenticated user's password. */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("POST", "/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  // ---- Profile ------------------------------------------------------------

  async getProfile(): Promise<ApiResponse<Profile>> {
    return this.request<Profile>("GET", "/profile");
  }

  async updateProfile(data: Profile): Promise<ApiResponse<Profile>> {
    return this.request<Profile>("PUT", "/profile", data);
  }

  // ---- Pregnancy ----------------------------------------------------------

  async getCurrentPregnancy(): Promise<ApiResponse<Pregnancy>> {
    return this.request<Pregnancy>("GET", "/pregnancy/current");
  }

  // ---- Dashboard ----------------------------------------------------------

  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.request<DashboardData>("GET", "/dashboard");
  }

  // ---- Appointments -------------------------------------------------------

  /**
   * GET /appointments
   * Backend returns { count, appointments } — we extract the `appointments` array.
   */
  async getAppointments(
    status?: string,
  ): Promise<ApiResponse<BackendAppointment[]>> {
    const endpoint = status
      ? `/appointments?status=${encodeURIComponent(status)}`
      : "/appointments";

    const res = await this.request<{
      count: number;
      appointments: BackendAppointment[];
    }>("GET", endpoint);

    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointments ?? [] };
  }

  async getAppointmentHistory(): Promise<ApiResponse<BackendAppointment[]>> {
    const res = await this.request<{
      count: number;
      appointments: BackendAppointment[];
    }>("GET", "/appointments/history");

    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointments ?? [] };
  }

  async getAppointment(
    id: string | number,
  ): Promise<ApiResponse<BackendAppointment>> {
    return this.request<BackendAppointment>("GET", `/appointments/${id}`);
  }

  async createAppointment(data: {
    type: string;
    title: string;
    appointment_date: string;
    appointment_time?: string;
    doctor_name?: string;
    location?: string;
    notes?: string;
  }): Promise<ApiResponse<BackendAppointment>> {
    // Backend returns { message, appointment } — unwrap the appointment object
    const res = await this.request<{
      message: string;
      appointment: BackendAppointment;
    }>("POST", "/appointments", data);
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointment ?? (res.data as any) };
  }

  async generatePrenatalPlan(): Promise<ApiResponse<BackendAppointment[]>> {
    const res = await this.request<{
      count: number;
      appointments: BackendAppointment[];
    }>("POST", "/appointments/generate-prenatal-plan");

    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointments ?? [] };
  }

  /**
   * POST /appointments/generate-monthly-analyses
   * Generates monthly serology reminders (toxoplasmosis + rubella).
   * Returns 400 if pregnancy profile not found — callers should handle gracefully.
   */
  async generateMonthlyAnalyses(): Promise<ApiResponse<BackendAppointment[]>> {
    const res = await this.request<{
      count: number;
      appointments: BackendAppointment[];
    }>("POST", "/appointments/generate-monthly-analyses");

    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointments ?? [] };
  }

  /**
   * Mark an appointment as done.
   * @param outcomeType  "normal" | "anomaly"
   * @param comment      Optional free-text comment.
   */
  async completeAppointment(
    id: string | number,
    outcomeType: "normal" | "anomaly",
    comment?: string,
  ): Promise<ApiResponse<BackendAppointment>> {
    const body: Record<string, any> = { outcome_type: outcomeType };
    if (comment !== undefined) body.comment = comment;
    // Backend returns { message, appointment, followup } — unwrap appointment
    const res = await this.request<{
      message: string;
      appointment: BackendAppointment;
      followup?: any;
    }>("POST", `/appointments/${id}/complete`, body);
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointment ?? (res.data as any) };
  }

  async updateAppointment(
    id: string | number,
    data: Partial<{
      type: string;
      title: string;
      appointment_date: string;
      appointment_time: string;
      doctor_name: string;
      location: string;
      notes: string;
    }>,
  ): Promise<ApiResponse<BackendAppointment>> {
    // Backend returns { message, appointment } — unwrap
    const res = await this.request<{
      message: string;
      appointment: BackendAppointment;
    }>("PUT", `/appointments/${id}`, data);
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.appointment ?? (res.data as any) };
  }

  async deleteAppointment(
    id: string | number,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("DELETE", `/appointments/${id}`);
  }

  // ---- Alerts -------------------------------------------------------------

  /**
   * GET /alerts
   * Backend returns { count, alerts } — we extract the `alerts` array.
   */
  async getAlerts(activeOnly?: boolean): Promise<ApiResponse<BackendAlert[]>> {
    const endpoint =
      activeOnly !== undefined
        ? `/alerts?active_only=${activeOnly}`
        : "/alerts";

    const res = await this.request<{
      count: number;
      alerts: BackendAlert[];
    }>("GET", endpoint);

    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: res.data?.alerts ?? [] };
  }

  async createAlert(data: {
    title: string;
    message: string;
    category: string;
    severity: string;
    source_table?: string;
    source_id?: number;
  }): Promise<ApiResponse<BackendAlert>> {
    return this.request<BackendAlert>("POST", "/alerts", data);
  }

  async resolveAlert(id: string | number): Promise<ApiResponse<BackendAlert>> {
    return this.request<BackendAlert>("PATCH", `/alerts/${id}/resolve`);
  }

  // ---- Weight -------------------------------------------------------------

  /** POST /followup/weight */
  async addWeightMeasurement(data: {
    weight_kg: number;
    note?: string;
    measured_at?: string;
  }): Promise<ApiResponse<WeightMeasurement>> {
    return this.request<WeightMeasurement>("POST", "/followup/weight", data);
  }

  /**
   * GET /followup/weight
   * Returns { count, total_gain_kg, measurements }.
   */
  async getWeightMeasurements(): Promise<
    ApiResponse<{
      count: number;
      total_gain_kg: number;
      measurements: WeightMeasurement[];
    }>
  > {
    return this.request<{
      count: number;
      total_gain_kg: number;
      measurements: WeightMeasurement[];
    }>("GET", "/followup/weight");
  }

  /** GET /followup/weight/latest */
  async getLatestWeight(): Promise<ApiResponse<WeightMeasurement>> {
    return this.request<WeightMeasurement>("GET", "/followup/weight/latest");
  }

  // ---- Blood Pressure -----------------------------------------------------

  /** POST /followup/blood-pressure */
  async addBloodPressure(data: {
    systolic: number;
    diastolic: number;
    note?: string;
    measured_at?: string;
  }): Promise<ApiResponse<BloodPressureMeasurement>> {
    return this.request<BloodPressureMeasurement>(
      "POST",
      "/followup/blood-pressure",
      data,
    );
  }

  /**
   * GET /followup/blood-pressure
   * Returns { count, measurements }.
   */
  async getBloodPressureMeasurements(): Promise<
    ApiResponse<{ count: number; measurements: BloodPressureMeasurement[] }>
  > {
    return this.request<{
      count: number;
      measurements: BloodPressureMeasurement[];
    }>("GET", "/followup/blood-pressure");
  }

  /** GET /followup/blood-pressure/latest */
  async getLatestBloodPressure(): Promise<
    ApiResponse<BloodPressureMeasurement>
  > {
    return this.request<BloodPressureMeasurement>(
      "GET",
      "/followup/blood-pressure/latest",
    );
  }

  // ---- Glucose ------------------------------------------------------------

  /** POST /followup/glucose */
  async addGlucose(data: {
    fasting_value: number;
    postprandial_value?: number;
    note?: string;
    measured_at?: string;
  }): Promise<ApiResponse<GlucoseMeasurement>> {
    return this.request<GlucoseMeasurement>("POST", "/followup/glucose", data);
  }

  /**
   * GET /followup/glucose
   * Returns { count, measurements }.
   */
  async getGlucoseMeasurements(): Promise<
    ApiResponse<{ count: number; measurements: GlucoseMeasurement[] }>
  > {
    return this.request<{
      count: number;
      measurements: GlucoseMeasurement[];
    }>("GET", "/followup/glucose");
  }

  /** GET /followup/glucose/latest */
  async getLatestGlucose(): Promise<ApiResponse<GlucoseMeasurement>> {
    return this.request<GlucoseMeasurement>("GET", "/followup/glucose/latest");
  }

  // ---- Fetal Movements ----------------------------------------------------

  /** POST /followup/fetal-movements/start */
  async startFetalMovementSession(): Promise<
    ApiResponse<FetalMovementSession>
  > {
    return this.request<FetalMovementSession>(
      "POST",
      "/followup/fetal-movements/start",
    );
  }

  /** POST /followup/fetal-movements/:id/increment */
  async incrementFetalMovement(
    sessionId: number,
  ): Promise<ApiResponse<FetalMovementSession>> {
    return this.request<FetalMovementSession>(
      "POST",
      `/followup/fetal-movements/${sessionId}/increment`,
    );
  }

  /** POST /followup/fetal-movements/:id/end */
  async endFetalMovementSession(
    sessionId: number,
    count?: number,
    note?: string,
  ): Promise<ApiResponse<FetalMovementSession>> {
    const body: Record<string, any> = {};
    if (count !== undefined) body.count = count;
    if (note !== undefined) body.note = note;
    return this.request<FetalMovementSession>(
      "POST",
      `/followup/fetal-movements/${sessionId}/end`,
      body,
    );
  }

  /** GET /followup/fetal-movements/open */
  async getOpenFetalMovementSession(): Promise<
    ApiResponse<FetalMovementSession | null>
  > {
    return this.request<FetalMovementSession | null>(
      "GET",
      "/followup/fetal-movements/open",
    );
  }

  /**
   * GET /followup/fetal-movements
   * Returns history list.
   */
  async getFetalMovementHistory(): Promise<
    ApiResponse<{ count: number; sessions: FetalMovementSession[] }>
  > {
    return this.request<{
      count: number;
      sessions: FetalMovementSession[];
    }>("GET", "/followup/fetal-movements");
  }

  /** POST /followup/fetal-movements/check-absence */
  async checkFetalMovementAbsence(): Promise<
    ApiResponse<{ alert_created: boolean; message: string }>
  > {
    return this.request<{ alert_created: boolean; message: string }>(
      "POST",
      "/followup/fetal-movements/check-absence",
    );
  }

  // ---- Settings -----------------------------------------------------------

  /** GET /settings */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return this.request<UserSettings>("GET", "/settings");
  }

  /** PUT /settings */
  async updateSettings(
    data: Partial<UserSettings>,
  ): Promise<ApiResponse<UserSettings>> {
    return this.request<UserSettings>("PUT", "/settings", data);
  }

  // ---- Tips ---------------------------------------------------------------

  /**
   * GET /tips
   * Returns TipsResponse (trimester + categories map).
   */
  async getTips(): Promise<ApiResponse<TipsResponse>> {
    return this.request<TipsResponse>("GET", "/tips");
  }

  /** GET /tips/categories */
  async getTipCategories(): Promise<ApiResponse<Record<string, TipCategory>>> {
    return this.request<Record<string, TipCategory>>("GET", "/tips/categories");
  }

  /**
   * GET /tips/:category?trimester=N
   * @param category  The category slug (e.g. "nutrition").
   * @param trimester Optional trimester filter (1 | 2 | 3).
   */
  async getTipsByCategory(
    category: string,
    trimester?: number,
  ): Promise<ApiResponse<TipCategory>> {
    const qs = trimester !== undefined ? `?trimester=${trimester}` : "";
    return this.request<TipCategory>(
      "GET",
      `/tips/${encodeURIComponent(category)}${qs}`,
    );
  }

  // ---- Chat (SSE) ---------------------------------------------------------

  async chat(
    message: string,
    history?: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<Response> {
    const res = await fetch(`${this.baseURL}/chat`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ message, history: history ?? [] }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
    }

    return res;
  }

  // ---- Conversations CRUD -------------------------------------------------

  async listConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.request<Conversation[]>("GET", "/chat/conversations");
  }

  async createConversation(title?: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>("POST", "/chat/conversations", {
      title: title ?? "New Conversation",
    });
  }

  async getConversation(id: number): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>("GET", `/chat/conversations/${id}`);
  }

  async renameConversation(
    id: number,
    title: string,
  ): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>("PUT", `/chat/conversations/${id}`, {
      title,
    });
  }

  async deleteConversation(
    id: number,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      "DELETE",
      `/chat/conversations/${id}`,
    );
  }

  /**
   * Send a message to a conversation.
   * Returns a raw `Response` whose body is an SSE stream.
   * Supports optional file attachment (multipart) or plain JSON.
   */
  async sendConversationMessage(
    convId: number,
    message: string,
    file?: File,
    model?: string,
  ): Promise<Response> {
    const authHeaders: HeadersInit = {};
    if (this.token) {
      authHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    let body: FormData | string;
    let contentHeaders: HeadersInit = {};

    if (file) {
      const fd = new FormData();
      fd.append("message", message);
      fd.append("file", file, file.name);
      if (model) fd.append("model", model);
      body = fd;
      // Do NOT set Content-Type — browser sets it with the correct boundary
    } else {
      body = JSON.stringify({ message, ...(model ? { model } : {}) });
      contentHeaders = { "Content-Type": "application/json" };
    }

    const res = await fetch(
      `${this.baseURL}/chat/conversations/${convId}/messages`,
      {
        method: "POST",
        headers: { ...authHeaders, ...contentHeaders },
        body,
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
    }

    return res;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------
export const apiClient = new ApiClient();
