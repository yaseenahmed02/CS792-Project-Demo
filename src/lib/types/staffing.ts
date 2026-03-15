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

export type BlockId = "B1" | "B2" | "B3" | "B4" | "B5" | "B6";

export interface StaffingBlock {
  blockId: BlockId;
  startHour: number; // 0, 4, 8, 12, 16, 20
  endHour: number; // 4, 8, 12, 16, 20, 24
  label: string; // "00:00 - 04:00"
  roles: RoleStaffing[];
  blockLoad: number;
  peakHour: number;
}

export interface RoleStaffing {
  role: RoleName;
  headcount: number;
  previousHeadcount: number;
  delta: number;
  rationale: string;
}

export interface StaffingProposal {
  generatedAt: string;
  scenarios: ScenarioState;
  riskPosture: RiskPosture;
  blocks: StaffingBlock[];
}

export type BlockDecision =
  | "pending"
  | "accepted"
  | "declined"
  | "manual"
  | "re-suggested";

export interface BlockDecisionState {
  blockId: BlockId;
  decision: BlockDecision;
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
  blockId: BlockId;
  constraints: StaffingConstraint[];
  riskPosture: RiskPosture;
  scenarios: ScenarioState;
}

export interface ReSuggestResponse {
  blockId: BlockId;
  original: RoleStaffing[];
  revised: RoleStaffing[];
  explanation: string;
  constraintsSatisfied: boolean;
}
