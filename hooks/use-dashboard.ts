import { useCallback, useEffect, useState } from "react";
import { apiClient, DashboardData } from "@/lib/api-client";

export function useDashboard(enabled = true) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await apiClient.getDashboard();

    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(
        response.error || response.message || "Failed to fetch dashboard data",
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    fetchDashboard();
  }, [enabled, fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
