import { useCallback, useEffect, useState } from "react";
import { apiClient, FetalMovementSession } from "@/lib/api-client";

export function useFetalMovements(enabled = true) {
  const [history, setHistory] = useState<FetalMovementSession[]>([]);
  const [openSession, setOpenSession] = useState<FetalMovementSession | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    const res = await apiClient.getFetalMovementHistory();
    if (res.success && res.data) setHistory(res.data.sessions ?? []);
    else setError(res.error || "Failed to fetch fetal movement history");
    setIsLoading(false);
  }, []);

  // getOpenFetalMovementSession returns ApiResponse<FetalMovementSession | null>
  const fetchOpenSession = useCallback(async () => {
    const res = await apiClient.getOpenFetalMovementSession();
    if (res.success) setOpenSession(res.data ?? null);
    else setOpenSession(null);
  }, []);

  // startFetalMovementSession returns ApiResponse<FetalMovementSession>
  const startSession = useCallback(async () => {
    const res = await apiClient.startFetalMovementSession();
    if (res.success && res.data) {
      setOpenSession(res.data);
    }
    return res;
  }, []);

  // incrementFetalMovement returns ApiResponse<FetalMovementSession>
  const increment = useCallback(async (sessionId: number) => {
    const res = await apiClient.incrementFetalMovement(sessionId);
    if (res.success && res.data) setOpenSession(res.data);
    return res;
  }, []);

  const endSession = useCallback(
    async (sessionId: number, count?: number, note?: string) => {
      const res = await apiClient.endFetalMovementSession(
        sessionId,
        count,
        note,
      );
      if (res.success) {
        setOpenSession(null);
        await fetchHistory();
      }
      return res;
    },
    [fetchHistory],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchHistory();
    fetchOpenSession();
  }, [enabled, fetchHistory, fetchOpenSession]);

  return {
    history,
    openSession,
    isLoading,
    error,
    startSession,
    increment,
    endSession,
    refetch: fetchHistory,
  };
}
