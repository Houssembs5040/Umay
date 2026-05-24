import { useCallback, useEffect, useState } from "react";
import { apiClient, User } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Response → User mapper
// ---------------------------------------------------------------------------

/**
 * Converts the raw backend auth response (login / register / getMe)
 * into the normalised frontend User object.
 *
 * The backend returns:
 *   { user: {id, phone, ...}, profile: {name, email, ...}, pregnancy_profile: {...} }
 */
function mapAuthResponseToUser(data: any): User | null {
  if (!data) return null;

  const backendUser = data.user ?? {};
  const profile = data.profile ?? {};
  const pregnancyProfile = data.pregnancy_profile ?? {};

  return {
    id: String(backendUser.id ?? profile.user_id ?? ""),
    phone: backendUser.phone ?? undefined,
    email: profile.email ?? undefined,
    name: profile.name ?? undefined,
    ddr: pregnancyProfile.lmp_date ?? undefined,
    dpa: pregnancyProfile.due_date ?? undefined,
    gestationalAge: pregnancyProfile.gestational_weeks ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token") ||
              localStorage.getItem("auth_token") // migrate legacy key
            : null;

        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        apiClient.setToken(token);
        const response = await apiClient.getMe();

        if (response.success && response.data) {
          const restored = mapAuthResponseToUser(response.data);
          setUser(restored);
        } else {
          apiClient.clearToken();
          setUser(null);
        }
      } catch (err: any) {
        apiClient.clearToken();
        setUser(null);
        setError(err?.message || "Failed to restore session");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── register ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (
      phone: string,
      password: string,
      lmpDate: string,
      name?: string,
      email?: string,
      age?: number,
      city?: string,
      heightCm?: number,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.register(
          phone,
          password,
          lmpDate,
          name,
          email,
          age,
          city,
          heightCm,
        );

        if (response.success && response.data) {
          setUser(mapAuthResponseToUser(response.data));
        } else {
          setError(response.error || response.message || "Registration failed");
        }

        return response;
      } catch (err: any) {
        const message = err?.message || "Registration failed";
        setError(message);
        return { success: false, error: message, message };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(phone, password);

      if (response.success && response.data) {
        setUser(mapAuthResponseToUser(response.data));
      } else {
        setError(response.error || response.message || "Login failed");
      }

      return response;
    } catch (err: any) {
      const message = err?.message || "Login failed";
      setError(message);
      return { success: false, error: message, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.logout();
      setUser(null);
    } catch (err: any) {
      setError(err?.message || "Logout failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    isLoggedIn: !!user,
  };
}
