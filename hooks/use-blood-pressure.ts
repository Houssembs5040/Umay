import { useCallback, useEffect, useState } from "react";
import { apiClient, BloodPressureMeasurement } from "@/lib/api-client";

export function useBloodPressure(enabled = true) {
  const [measurements, setMeasurements] = useState<BloodPressureMeasurement[]>(
    [],
  );
  const [latest, setLatest] = useState<BloodPressureMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const res = await apiClient.getBloodPressureMeasurements();
    if (res.success && res.data) setMeasurements(res.data.measurements ?? []);
    else setError(res.error || "Failed to fetch blood pressure data");
    setIsLoading(false);
  }, []);

  const fetchLatest = useCallback(async () => {
    const res = await apiClient.getLatestBloodPressure();
    if (res.success && res.data) setLatest(res.data);
  }, []);

  const addEntry = useCallback(
    async (
      systolic: number,
      diastolic: number,
      note?: string,
      measuredAt?: string,
    ) => {
      const res = await apiClient.addBloodPressure({
        systolic,
        diastolic,
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
