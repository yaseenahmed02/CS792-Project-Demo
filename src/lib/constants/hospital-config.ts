import type { HospitalConfig } from "@/lib/types";
import { DEFAULT_EQUIPMENT } from "./equipment";
import { DEFAULT_SHIFTS } from "./shifts";

export const DEFAULT_HOSPITAL_CONFIG: HospitalConfig = {
  operatingRooms: 4,
  totalBeds: 58,
  diagnosticEquipment: DEFAULT_EQUIPMENT,
  shiftTemplates: DEFAULT_SHIFTS,
  staffPool: {
    "Attending Physician": 6,
    "Emergency Nurse": 12,
    "Triage Nurse": 4,
    "Resident": 6,
    "Trauma Surgeon": 3,
    "Radiologist": 3,
    "Respiratory Therapist": 3,
    "Social Worker": 2,
    "Security Officer": 4,
  },
};
