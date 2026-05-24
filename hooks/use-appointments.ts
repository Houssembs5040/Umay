import { useCallback, useEffect, useState } from "react";
import { apiClient, BackendAppointment } from "@/lib/api-client";

export function useAppointments(enabled = true) {
  const [appointments, setAppointments] = useState<BackendAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);

    const response = await apiClient.getAppointments(status);

    if (response.success && response.data) {
      setAppointments(response.data);
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
        setAppointments((prev) => [...prev, response.data!]);
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
      setAppointments(response.data);
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
    refetch: fetchAppointments,
  };
}
