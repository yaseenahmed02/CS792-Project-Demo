import type { RoleName } from "./staffing";

export interface CTASLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
  requiresOR: boolean;
  diagnosticRouting: string[];
  avgLengthOfStayHours: number;
  staffMultiplier: number;
  canEscalateTo: number | null;
  canDeescalateTo: number | null;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  isOvernight: boolean;
  category: "core" | "swing" | "flex";
}

export interface DiagnosticEquipment {
  id: string;
  name: string;
  count: number;
  avgUsageMinutes: number;
  requiredForCTAS: number[];
}

export type ArrivalMode = "walk-in" | "ambulance" | "transfer";

export interface HospitalConfig {
  operatingRooms: number;
  totalBeds: number;
  diagnosticEquipment: DiagnosticEquipment[];
  shiftTemplates: ShiftTemplate[];
  staffPool: Record<RoleName, number>;
}
