import type {
  ShiftId,
  RoleName,
  RoleStaffing,
  StaffingConstraint,
} from "./staffing";
import type { RiskPosture, ScenarioState } from "./forecast";

export type AuditEventType =
  | "proposal_generated"
  | "shift_accepted"
  | "shift_declined"
  | "manual_override"
  | "re_suggest_requested"
  | "re_suggest_accepted"
  | "schedule_exported";

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  shiftId?: ShiftId;
  summary: string;
  detail: AuditDetail;
}

export interface AuditDetail {
  decisionMaker: string;
  riskPosture: RiskPosture;
  scenarios: ScenarioState;
  forecastContext?: {
    peakOccupancy: number;
    peakArrivals: number;
  };
  originalStaffing?: RoleStaffing[];
  revisedStaffing?: RoleStaffing[];
  constraints?: StaffingConstraint[];
  declineReason?: string;
  manualOverrides?: { role: RoleName; from: number; to: number }[];
}
