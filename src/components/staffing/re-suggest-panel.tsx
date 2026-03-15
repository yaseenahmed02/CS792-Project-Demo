"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  BlockId,
  RoleStaffing,
  StaffingConstraint,
  ReSuggestResponse,
} from "@/lib/types";
import { useScenarioStore } from "@/lib/store";
import { formatDelta } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface ReSuggestPanelProps {
  blockId: BlockId;
  originalStaffing: RoleStaffing[];
  constraints: StaffingConstraint[];
  onAcceptRevised: (staffing: RoleStaffing[]) => void;
  onKeepOriginal: () => void;
}

/**Panel showing re-suggestion results with side-by-side comparison.*/
export function ReSuggestPanel({
  blockId,
  originalStaffing,
  constraints,
  onAcceptRevised,
  onKeepOriginal,
}: ReSuggestPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState<ReSuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const riskPosture = useScenarioStore((s) => s.riskPosture);

  useEffect(() => {
    fetchReSuggestion();
  }, []);

  async function fetchReSuggestion() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staffing/re-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          constraints,
          riskPosture,
          scenarios,
          originalStaffing,
        }),
      });

      if (!res.ok) {
        throw new Error(`Re-suggest API returned ${res.status}`);
      }

      const data: ReSuggestResponse = await res.json();
      setResponse(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get re-suggestion";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Generating revised proposal...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!response) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!response.constraintsSatisfied && (
        <p className="text-xs text-amber-600">
          Not all constraints could be fully satisfied while maintaining
          minimum staffing levels.
        </p>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-1.5 text-left text-xs font-medium text-muted-foreground">
              Role
            </th>
            <th className="py-1.5 text-center text-xs font-medium text-muted-foreground">
              Original
            </th>
            <th className="py-1.5 text-center text-xs font-medium text-muted-foreground">
              Revised
            </th>
            <th className="py-1.5 text-right text-xs font-medium text-muted-foreground">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {response.revised.map((revised, i) => {
            const original = response.original[i];
            const delta = revised.headcount - original.headcount;

            return (
              <tr key={revised.role} className="border-b last:border-b-0">
                <td className="py-2 text-sm">{revised.role}</td>
                <td className="py-2 text-center tabular-nums text-muted-foreground">
                  {original.headcount}
                </td>
                <td className="py-2 text-center font-medium tabular-nums">
                  {revised.headcount}
                </td>
                <td className="py-2 text-right">
                  {delta !== 0 && (
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        delta > 0 ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {formatDelta(delta)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground">{response.explanation}</p>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onKeepOriginal} className="text-xs">
          Keep original
        </Button>
        <Button size="sm" onClick={() => onAcceptRevised(response.revised)} className="text-xs">
          Accept revised
        </Button>
      </div>
    </div>
  );
}
