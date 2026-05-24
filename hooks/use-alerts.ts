import { useCallback, useEffect, useState } from "react";
import { apiClient, BackendAlert } from "@/lib/api-client";

export function useAlerts(enabled = true) {
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (activeOnly?: boolean) => {
    setIsLoading(true);
    setError(null);

    const response = await apiClient.getAlerts(activeOnly);

    if (response.success && response.data) {
      setAlerts(response.data);
    } else {
      setError(response.error || response.message || "Failed to fetch alerts");
    }

    setIsLoading(false);
  }, []);

  const createAlert = useCallback(
    async (data: {
      category: string;
      severity: string;
      title: string;
      message: string;
    }) => {
      const response = await apiClient.createAlert(data);

      if (response.success && response.data) {
        setAlerts((prev) => [...prev, response.data!]);
      }

      return response;
    },
    [],
  );

  const resolveAlert = useCallback(async (id: string | number) => {
    const response = await apiClient.resolveAlert(id);

    if (response.success && response.data) {
      // Update the resolved alert in local state, then keep only active ones
      setAlerts((prev) =>
        prev
          .map((a) => (a.id === id ? response.data! : a))
          .filter((a) => a.is_active),
      );
    }

    return response;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    fetchAlerts();
  }, [enabled, fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    createAlert,
    resolveAlert,
    refetch: fetchAlerts,
  };
}
