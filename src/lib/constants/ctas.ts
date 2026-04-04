import type { CTASLevel } from "@/lib/types";

export const CTAS_LEVELS: CTASLevel[] = [
  { level: 1, name: "Resuscitation", color: "#dc2626", requiresOR: true, diagnosticRouting: ["ct", "lab", "xray"], avgLengthOfStayHours: 8, staffMultiplier: 4.0, canEscalateTo: null, canDeescalateTo: 2 },
  { level: 2, name: "Emergent", color: "#f97316", requiresOR: true, diagnosticRouting: ["ct", "lab", "xray"], avgLengthOfStayHours: 6, staffMultiplier: 2.5, canEscalateTo: 1, canDeescalateTo: 3 },
  { level: 3, name: "Urgent", color: "#eab308", requiresOR: false, diagnosticRouting: ["xray", "lab"], avgLengthOfStayHours: 4, staffMultiplier: 1.5, canEscalateTo: 2, canDeescalateTo: 4 },
  { level: 4, name: "Less Urgent", color: "#22c55e", requiresOR: false, diagnosticRouting: [], avgLengthOfStayHours: 2.5, staffMultiplier: 1.0, canEscalateTo: 3, canDeescalateTo: 5 },
  { level: 5, name: "Non-Urgent", color: "#3b82f6", requiresOR: false, diagnosticRouting: [], avgLengthOfStayHours: 1.5, staffMultiplier: 0.5, canEscalateTo: 4, canDeescalateTo: null },
];
