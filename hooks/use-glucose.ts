import { useCallback, useEffect, useState } from "react";
import { apiClient, GlucoseMeasurement } from "@/lib/api-client";

export function useGlucose(enabled = true) {
  const [measurements, setMeasurements] = useState<GlucoseMeasurement[]>([]);
  const [latest, setLatest] = useState<GlucoseMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const res = await apiClient.getGlucoseMeasurements();
    if (res.success && res.data) setMeasurements(res.data.measurements ?? []);
    else setError(res.error || "Failed to fetch glucose data");
    setIsLoading(false);
  }, []);

  const fetchLatest = useCallback(async () => {
    const res = await apiClient.getLatestGlucose();
    if (res.success && res.data) setLatest(res.data);
  }, []);

  const addEntry = useCallback(
    async (
      fasting_value: number,
      postprandial_value?: number,
      note?: string,
      measuredAt?: string,
    ) => {
      const res = await apiClient.addGlucose({
        fasting_value,
        postprandial_value,
        note,
        measured_at: measuredAt,
      });
      if (res.success) {
        await fetchAll();
        await fetchLatest();
      }
      return res;
    },
    [fetchAll, fetchLatest],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchAll();
    fetchLatest();
  }, [enabled, fetchAll, fetchLatest]);

  return { measurements, latest, isLoading, error, addEntry, refetch: fetchAll };
}
