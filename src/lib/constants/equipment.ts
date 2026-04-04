import type { DiagnosticEquipment } from "@/lib/types";

export const DEFAULT_EQUIPMENT: DiagnosticEquipment[] = [
  { id: "xray", name: "X-Ray Machine", count: 1, avgUsageMinutes: 20, requiredForCTAS: [1, 2, 3] },
  { id: "ct", name: "CT Scanner", count: 1, avgUsageMinutes: 30, requiredForCTAS: [1, 2] },
  { id: "ultrasound", name: "Ultrasound", count: 2, avgUsageMinutes: 15, requiredForCTAS: [2, 3] },
  { id: "lab", name: "Lab Station", count: 3, avgUsageMinutes: 45, requiredForCTAS: [1, 2, 3] },
];
