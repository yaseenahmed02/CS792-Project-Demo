"use client";

import { useState, useEffect, useCallback } from "react";
import type { ForecastResponse } from "@/lib/types";
import { useScenarioStore } from "@/lib/store";

interface UseForecastResult {
  forecast: ForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch the forecast from /api/forecast based on current scenario state.
 * Auto-refetches when scenarios or risk posture change.
 */
export function useForecast(): UseForecastResult {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const riskPosture = useScenarioStore((s) => s.riskPosture);

  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      influenzaOutbreak: String(scenarios.influenzaOutbreak),
      majorIncident: String(scenarios.majorIncident),
      riskPosture,
    });

    try {
      const response = await fetch(`/api/forecast?${params}`);

      if (!response.ok) {
        throw new Error(`Forecast API returned ${response.status}`);
      }

      const data: ForecastResponse = await response.json();
      setForecast(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch forecast";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [scenarios.influenzaOutbreak, scenarios.majorIncident, riskPosture]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, isLoading, error, refetch: fetchForecast };
}
