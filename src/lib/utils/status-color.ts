import type { RiskPosture } from "@/lib/types";
import { RISK_COLORS } from "@/lib/constants";

/**Get the full color config for a risk posture level.*/
export function getRiskColors(posture: RiskPosture) {
  return RISK_COLORS[posture];
}

/**
 * Get a Tailwind background color class for a load intensity value.
 * Maps load as a fraction of maxLoad to a green-yellow-red gradient.
 */
export function getLoadIntensityColor(load: number, maxLoad: number): string {
  if (maxLoad === 0) return "bg-slate-100";

  const ratio = Math.min(load / maxLoad, 1);

  if (ratio < 0.4) return "bg-emerald-100";
  if (ratio < 0.6) return "bg-emerald-200";
  if (ratio < 0.75) return "bg-amber-100";
  if (ratio < 0.9) return "bg-amber-200";
  return "bg-rose-200";
}

/**Get a Tailwind text color class for a staffing delta value.*/
export function getDeltaColor(delta: number): string {
  if (delta > 0) return "text-emerald-600";
  if (delta < 0) return "text-rose-600";
  return "text-slate-400";
}
