import { useCallback, useEffect, useState } from "react";
import { apiClient, WeightMeasurement } from "@/lib/api-client";

export function useWeight(enabled = true) {
  const [measurements, setMeasurements] = useState<WeightMeasurement[]>([]);
  const [totalGainKg, setTotalGainKg] = useState<number | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightMeasurement | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeasurements = useCallback(async () => {
    setIsLoading(true);
    const res = await apiClient.getWeightMeasurements();
    if (res.success && res.data) {
      setMeasurements(res.data.measurements ?? []);
      setTotalGainKg(res.data.total_gain_kg ?? null);
    } else {
      setError(res.error || "Failed to fetch weight data");
    }
    setIsLoading(false);
  }, []);

  const fetchLatest = useCallback(async () => {
    const res = await apiClient.getLatestWeight();
    if (res.success && res.data) setLatestWeight(res.data);
  }, []);

  const addEntry = useCallback(
    async (weight_kg: number, note?: string, measuredAt?: string) => {
      const res = await apiClient.addWeightMeasurement({
        weight_kg,
        note,
        measured_at: measuredAt,
      });
      if (res.success) {
        await fetchMeasurements();
        await fetchLatest();
      }
      return res;
    },
    [fetchMeasurements, fetchLatest],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchMeasurements();
    fetchLatest();
  }, [enabled, fetchMeasurements, fetchLatest]);

  return {
    measurements,
    totalGainKg,
    latestWeight,
    isLoading,
    error,
    addEntry,
    refetch: fetchMeasurements,
  };
}
