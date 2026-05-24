import { useCallback, useEffect, useState } from "react";
import { apiClient, BackendAppointment } from "@/lib/api-client";

/** Sorts appointments ascending by date, then by id as a stable tiebreaker. */
function sortByDate(list: BackendAppointment[]): BackendAppointment[] {
  return [...list].sort((a, b) => {
    const diff =
      new Date(a.appointment_date).getTime() -
      new Date(b.appointment_date).getTime();
    return diff !== 0 ? diff : a.id - b.id;
  });
}

export function useAppointments(enabled = true) {
  const [appointments, setAppointments] = useState<BackendAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);

    const response = await apiClient.getAppointments(status);

    if (response.success && response.data) {
      setAppointments(sortByDate(response.data));
    } else {
      setError(
        response.error || response.message || "Failed to fetch appointments",
      );
    }

    setIsLoading(false);
  }, []);

  const createAppointment = useCallback(
    async (data: {
      type: string;
      title: string;
      appointment_date: string;
      appointment_time?: string;
      doctor_name?: string;
      location?: string;
      notes?: string;
    }) => {
      const response = await apiClient.createAppointment(data);

      if (response.success && response.data) {
        setAppointments((prev) => sortByDate([...prev, response.data!]));
      }

      return response;
    },
    [],
  );

  const completeAppointment = useCallback(
    async (
      id: string | number,
      outcomeType: "normal" | "anomaly",
      comment?: string,
    ) => {
      const response = await apiClient.completeAppointment(
        id,
        outcomeType,
        comment,
      );

      if (response.success && response.data) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === id ? { ...apt, ...response.data } : apt,
          ),
        );
      }

      return response;
    },
    [],
  );

  const updateAppointment = useCallback(
    async (
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
    ) => {
      const response = await apiClient.updateAppointment(id, data);

      if (response.success && response.data) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === id ? { ...apt, ...response.data } : apt,
          ),
        );
      }

      return response;
    },
    [],
  );

  const deleteAppointment = useCallback(async (id: string | number) => {
    const response = await apiClient.deleteAppointment(id);

    if (response.success) {
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    }

    return response;
  }, []);

  const generatePrenatalPlan = useCallback(async () => {
    const response = await apiClient.generatePrenatalPlan();

    if (response.success && response.data) {
      setAppointments(sortByDate(response.data));
    }

    return response;
  }, []);

  /**
   * Calls POST /appointments/generate-monthly-analyses.
   * On success, merges the new serology reminders into the existing list
   * (avoids overwriting appointments already in state).
   * Gracefully ignores 400 "pregnancy profile not found" errors.
   */
  const generateMonthlyAnalyses = useCallback(async () => {
    const response = await apiClient.generateMonthlyAnalyses();

    if (response.success && response.data && response.data.length > 0) {
      setAppointments((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newOnes = response.data!.filter((a) => !existingIds.has(a.id));
        return newOnes.length > 0 ? sortByDate([...prev, ...newOnes]) : prev;
      });
    }

    return response;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    fetchAppointments();
  }, [enabled, fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    createAppointment,
    completeAppointment,
    updateAppointment,
    deleteAppointment,
    generatePrenatalPlan,
    generateMonthlyAnalyses,
    refetch: fetchAppointments,
  };
}
