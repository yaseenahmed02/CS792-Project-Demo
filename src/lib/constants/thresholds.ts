export const OCCUPANCY_CAPACITY = 58;
export const OCCUPANCY_WARNING = 45;
export const WAIT_TIME_TARGET_MINUTES = 30;
export const ARRIVAL_BASELINE_NONSEVERE = 6;
export const ARRIVAL_BASELINE_ACUITY = 1.5;

export const RISK_COLORS = {
  normal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  elevated: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
  critical: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    gradient: "from-rose-500 to-rose-600",
  },
} as const;

export const CHART_COLORS = {
  p10: "#10b981", // emerald-500
  p50: "#f59e0b", // amber-500
  p90: "#f43f5e", // rose-500
  p10Fill: "rgba(16, 185, 129, 0.1)",
  p50Fill: "rgba(245, 158, 11, 0.15)",
  p90Fill: "rgba(244, 63, 94, 0.08)",
  capacity: "#ef4444", // red-500
  blockBoundary: "#94a3b8", // slate-400
} as const;
