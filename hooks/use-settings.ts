import { useCallback, useEffect, useState } from "react";
import { apiClient, UserSettings } from "@/lib/api-client";

export function useSettings(enabled = true) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // getSettings returns ApiResponse<UserSettings> directly
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const res = await apiClient.getSettings();
    if (res.success && res.data) setSettings(res.data);
    else setError(res.error || "Failed to fetch settings");
    setIsLoading(false);
  }, []);

  // updateSettings returns ApiResponse<UserSettings> directly
  const updateSettings = useCallback(async (data: Partial<UserSettings>) => {
    const res = await apiClient.updateSettings(data);
    if (res.success && res.data) setSettings(res.data);
    return res;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchSettings();
  }, [enabled, fetchSettings]);

  return { settings, isLoading, error, updateSettings, refetch: fetchSettings };
}
