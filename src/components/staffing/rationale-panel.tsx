"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { StaffingBlock } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatHour } from "@/lib/utils/format";

interface RationalePanelProps {
  block: StaffingBlock;
  riskPosture: string;
  scenarios: { influenzaOutbreak: boolean; majorIncident: boolean };
}

/**Collapsible panel explaining the rationale behind a block's staffing.*/
export function RationalePanel({
  block,
  riskPosture,
  scenarios,
}: RationalePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeScenarios = buildActiveScenarios(scenarios);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            isOpen && "rotate-90",
          )}
        />
        Why this schedule for {block.blockId}?
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 pl-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
            <FactorItem label="Risk posture" value={riskPosture} />
            <FactorItem label="Peak load" value={block.blockLoad.toFixed(1)} />
            <FactorItem label="Peak hour" value={formatHour(block.peakHour)} />
            <FactorItem
              label="Active scenarios"
              value={activeScenarios || "None"}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Role-by-role reasoning
            </p>
            {block.roles.map((role) => (
              <p key={role.role} className="text-xs text-muted-foreground">
                {role.rationale}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FactorItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium capitalize text-foreground">{value}</span>
    </div>
  );
}

function buildActiveScenarios(scenarios: {
  influenzaOutbreak: boolean;
  majorIncident: boolean;
}): string {
  const active: string[] = [];
  if (scenarios.influenzaOutbreak) active.push("Influenza");
  if (scenarios.majorIncident) active.push("Major Incident");
  return active.join(", ");
}
