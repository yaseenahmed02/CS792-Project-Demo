"use client";

import { useEffect, useState } from "react";
import type { BlockId, BlockDecision } from "@/lib/types";
import { BLOCKS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const DECISION_DOT_COLOR: Record<BlockDecision, string> = {
  pending: "bg-muted-foreground/30",
  accepted: "bg-emerald-500",
  declined: "bg-rose-500",
  manual: "bg-blue-500",
  "re-suggested": "bg-amber-500",
};

const DECISION_LABEL: Record<BlockDecision, string> = {
  pending: "",
  accepted: "Accepted",
  declined: "Declined",
  manual: "Manual",
  "re-suggested": "Revised",
};

const HOURS_IN_DAY = 24;

interface BlockTimelineProps {
  decisions: Record<BlockId, { decision: BlockDecision }>;
}

/**Horizontal timeline showing 6 block segments with subtle decision indicators.*/
export function BlockTimeline({ decisions }: BlockTimelineProps) {
  const [currentHourFraction, setCurrentHourFraction] = useState(
    getCurrentHourFraction,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHourFraction(getCurrentHourFraction());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const currentPercent = (currentHourFraction / HOURS_IN_DAY) * 100;

  return (
    <div className="w-full">
      <div className="flex gap-1">
        {BLOCKS.map((block) => {
          const decision = decisions[block.id]?.decision ?? "pending";

          return (
            <div
              key={block.id}
              className={cn(
                "relative flex-1 rounded border px-2 py-2 transition-colors",
                decision === "accepted" ? "bg-emerald-500/5 border-emerald-500/20" :
                decision === "declined" ? "bg-rose-500/5 border-rose-500/20" :
                decision === "manual" ? "bg-blue-500/5 border-blue-500/20" :
                decision === "re-suggested" ? "bg-amber-500/5 border-amber-500/20" :
                "bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {block.label}
                </span>
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    DECISION_DOT_COLOR[decision],
                  )}
                />
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  {block.id}
                </span>
                {DECISION_LABEL[decision] && (
                  <span className="text-[10px] text-muted-foreground">
                    {DECISION_LABEL[decision]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current time indicator */}
      <div className="relative mt-1.5 h-px w-full bg-border">
        <div
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-foreground"
          style={{ left: `${currentPercent}%` }}
        />
      </div>
    </div>
  );
}

function getCurrentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
