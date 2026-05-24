import { useCallback, useEffect, useState } from "react";
import { apiClient, TipsResponse } from "@/lib/api-client";

export function useTips(enabled = true) {
  const [data, setData] = useState<TipsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = useCallback(async () => {
    setIsLoading(true);
    const res = await apiClient.getTips();
    if (res.success && res.data) setData(res.data);
    else setError(res.error || "Failed to fetch tips");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchTips();
  }, [enabled, fetchTips]);

  return { data, isLoading, error, refetch: fetchTips };
}
