import type { RiskPosture, ScenarioState } from "./forecast";

export type RoleName =
  | "Attending Physician"
  | "Emergency Nurse"
  | "Triage Nurse"
  | "Resident"
  | "Trauma Surgeon"
  | "Radiologist"
  | "Respiratory Therapist"
  | "Social Worker"
  | "Security Officer";

export type ShiftId = string;

export interface StaffingShift {
  shiftId: ShiftId;
  name: string;
  startHour: number;
  endHour: number;
  isOvernight: boolean;
  category: "core" | "swing" | "flex";
  roles: RoleStaffing[];
  shiftLoad: number;
  peakHour: number;
}

export interface RoleStaffing {
  role: RoleName;
  headcount: number;
  previousHeadcount: number;
  delta: number;
  rationale: string;
}

export interface HourlyRoleDemand {
  hour: number;
  roles: Record<RoleName, number>;
}

export interface ResourceUtilization {
  orUtilization: number[];
  equipmentUtilization: Record<string, number[]>;
}

export interface StaffingProposal {
  generatedAt: string;
  scenarios: ScenarioState;
  riskPosture: RiskPosture;
  shifts: StaffingShift[];
  hourlyDemand: HourlyRoleDemand[];
  hourlyCoverage: HourlyRoleDemand[];
  resourceUtilization: ResourceUtilization;
}

export type ShiftDecision =
  | "pending"
  | "accepted"
  | "declined"
  | "manual"
  | "re-suggested";

export interface ShiftDecisionState {
  shiftId: ShiftId;
  decision: ShiftDecision;
  decidedAt?: string;
  originalProposal: RoleStaffing[];
  currentStaffing: RoleStaffing[];
  declineReason?: string;
  constraints?: StaffingConstraint[];
}

export interface StaffingConstraint {
  role: RoleName;
  type: "min" | "max" | "exact";
  value: number;
}

export interface ReSuggestRequest {
  shiftId: ShiftId;
  constraints: StaffingConstraint[];
  riskPosture: RiskPosture;
  scenarios: ScenarioState;
}

export interface ReSuggestResponse {
  shiftId: ShiftId;
  original: RoleStaffing[];
  revised: RoleStaffing[];
  explanation: string;
  constraintsSatisfied: boolean;
}
