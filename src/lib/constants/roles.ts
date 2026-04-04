import type { RoleName } from "@/lib/types";

export interface RoleConfig {
  name: RoleName;
  serviceRate: number; // patients/hour/staff
  acuityWeight: number; // how much high-acuity affects need (0-1)
  occupancyWeight: number; // how much occupancy affects need (0-1)
  minStaff: number; // absolute minimum for any shift
  icon: string; // lucide icon name
  requiredForCTAS: number[];
  canWorkShiftCategories: ("core" | "swing" | "flex")[];
}

export const ROLES: RoleConfig[] = [
  {
    name: "Attending Physician",
    serviceRate: 2.5,
    acuityWeight: 0.6,
    occupancyWeight: 0.3,
    minStaff: 2,
    icon: "Stethoscope",
    requiredForCTAS: [1, 2, 3, 4, 5],
    canWorkShiftCategories: ["core", "swing", "flex"],
  },
  {
    name: "Emergency Nurse",
    serviceRate: 4.0,
    acuityWeight: 0.4,
    occupancyWeight: 0.5,
    minStaff: 4,
    icon: "Heart",
    requiredForCTAS: [1, 2, 3, 4],
    canWorkShiftCategories: ["core", "swing", "flex"],
  },
  {
    name: "Triage Nurse",
    serviceRate: 6.0,
    acuityWeight: 0.2,
    occupancyWeight: 0.2,
    minStaff: 1,
    icon: "ClipboardList",
    requiredForCTAS: [1, 2, 3, 4, 5],
    canWorkShiftCategories: ["core", "swing", "flex"],
  },
  {
    name: "Resident",
    serviceRate: 3.0,
    acuityWeight: 0.5,
    occupancyWeight: 0.3,
    minStaff: 1,
    icon: "GraduationCap",
    requiredForCTAS: [2, 3, 4, 5],
    canWorkShiftCategories: ["core", "swing"],
  },
  {
    name: "Trauma Surgeon",
    serviceRate: 1.5,
    acuityWeight: 0.9,
    occupancyWeight: 0.1,
    minStaff: 1,
    icon: "Scissors",
    requiredForCTAS: [1, 2],
    canWorkShiftCategories: ["core", "flex"],
  },
  {
    name: "Radiologist",
    serviceRate: 5.0,
    acuityWeight: 0.3,
    occupancyWeight: 0.1,
    minStaff: 1,
    icon: "Scan",
    requiredForCTAS: [1, 2, 3],
    canWorkShiftCategories: ["core", "swing"],
  },
  {
    name: "Respiratory Therapist",
    serviceRate: 4.0,
    acuityWeight: 0.7,
    occupancyWeight: 0.2,
    minStaff: 1,
    icon: "Wind",
    requiredForCTAS: [1, 2],
    canWorkShiftCategories: ["core", "swing", "flex"],
  },
  {
    name: "Social Worker",
    serviceRate: 3.0,
    acuityWeight: 0.1,
    occupancyWeight: 0.4,
    minStaff: 1,
    icon: "Users",
    requiredForCTAS: [3, 4, 5],
    canWorkShiftCategories: ["core"],
  },
  {
    name: "Security Officer",
    serviceRate: 8.0,
    acuityWeight: 0.2,
    occupancyWeight: 0.5,
    minStaff: 1,
    icon: "Shield",
    requiredForCTAS: [1, 2, 3, 4, 5],
    canWorkShiftCategories: ["core", "swing", "flex"],
  },
];
