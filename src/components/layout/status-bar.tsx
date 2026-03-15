"use client";

import { useScenarioStore } from "@/lib/store/scenario-store";
import { RISK_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

function buildActiveScenarioLabels(scenarios: {
  influenzaOutbreak: boolean;
  majorIncident: boolean;
}): string[] {
  const labels: string[] = [];
  if (scenarios.influenzaOutbreak) labels.push("Influenza Outbreak");
  if (scenarios.majorIncident) labels.push("Major Incident");
  return labels;
}

const DOT_SEPARATOR = (
  <span className="text-muted-foreground/40" aria-hidden>
    &middot;
  </span>
);

export function StatusBar() {
  const { riskPosture, scenarios } = useScenarioStore();
  const colors = RISK_COLORS[riskPosture];
  const activeScenarios = buildActiveScenarioLabels(scenarios);

  return (
    <div className="flex h-8 items-center gap-3 border-b bg-background px-6 text-xs">
      {/* Risk posture */}
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
        <span className={cn("capitalize text-muted-foreground", colors.text)}>
          {riskPosture}
        </span>
      </div>

      {/* Active scenarios */}
      {activeScenarios.length > 0 && (
        <>
          {DOT_SEPARATOR}
          <div className="flex items-center gap-2">
            {activeScenarios.map((label, index) => (
              <span key={label} className="flex items-center gap-2">
                {index > 0 && DOT_SEPARATOR}
                <span className="text-muted-foreground">{label}</span>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last forecast timestamp */}
      <span className="text-muted-foreground">Last forecast: just now</span>
    </div>
  );
}
