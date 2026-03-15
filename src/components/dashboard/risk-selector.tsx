"use client";

import { motion } from "framer-motion";
import { useScenarioStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";
import type { RiskPosture } from "@/lib/types";

interface RiskOption {
  posture: RiskPosture;
  label: string;
  quantile: string;
  dotColor: string;
}

const RISK_OPTIONS: RiskOption[] = [
  { posture: "normal", label: "Normal", quantile: "P10", dotColor: "bg-emerald-500" },
  { posture: "elevated", label: "Elevated", quantile: "P50", dotColor: "bg-amber-500" },
  { posture: "critical", label: "Critical", quantile: "P90", dotColor: "bg-rose-500" },
];

/**Segmented control for selecting risk posture (Normal/Elevated/Critical).*/
export function RiskSelector() {
  const riskPosture = useScenarioStore((s) => s.riskPosture);
  const setRiskPosture = useScenarioStore((s) => s.setRiskPosture);

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Risk posture
      </h3>
      <div className="relative flex gap-1 rounded-lg bg-muted/50 p-0.5">
        {RISK_OPTIONS.map((option) => {
          const isSelected = riskPosture === option.posture;

          return (
            <button
              key={option.posture}
              onClick={() => setRiskPosture(option.posture)}
              className={cn(
                "relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors z-10",
                isSelected
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="risk-pill"
                  className="absolute inset-0 rounded-md bg-background shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <span className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full transition-opacity", option.dotColor, isSelected ? "opacity-100" : "opacity-30")} />
                  {option.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {option.quantile}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
