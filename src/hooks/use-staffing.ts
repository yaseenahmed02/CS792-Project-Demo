"use client";

import { useState, useEffect, useCallback } from "react";
import type { StaffingProposal } from "@/lib/types";
import { useScenarioStore } from "@/lib/store";

interface UseStaffingResult {
  proposal: StaffingProposal | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch the staffing proposal from /api/staffing based on current scenario state.
 * Auto-refetches when scenarios or risk posture change.
 * Returns a StaffingProposal with shifts (not blocks).
 */
export function useStaffing(): UseStaffingResult {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const riskPosture = useScenarioStore((s) => s.riskPosture);

  const [proposal, setProposal] = useState<StaffingProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffing = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      influenzaOutbreak: String(scenarios.influenzaOutbreak),
      majorIncident: String(scenarios.majorIncident),
      riskPosture,
    });

    try {
      const response = await fetch(`/api/staffing?${params}`);

      if (!response.ok) {
        throw new Error(`Staffing API returned ${response.status}`);
      }

      const data: StaffingProposal = await response.json();
      setProposal(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch staffing proposal";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [scenarios.influenzaOutbreak, scenarios.majorIncident, riskPosture]);

  useEffect(() => {
    fetchStaffing();
  }, [fetchStaffing]);

  return { proposal, isLoading, error, refetch: fetchStaffing };
}
