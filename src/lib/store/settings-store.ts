import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HospitalConfig, DiagnosticEquipment, ShiftTemplate } from "@/lib/types";
import type { RoleName } from "@/lib/types";
import { DEFAULT_EQUIPMENT } from "@/lib/constants/equipment";
import { DEFAULT_SHIFTS } from "@/lib/constants/shifts";

const DEFAULT_STAFF_POOL: Record<RoleName, number> = {
  "Attending Physician": 8,
  "Emergency Nurse": 15,
  "Triage Nurse": 4,
  "Resident": 6,
  "Trauma Surgeon": 3,
  "Radiologist": 3,
  "Respiratory Therapist": 4,
  "Social Worker": 2,
  "Security Officer": 4,
};

const DEFAULT_CONFIG: HospitalConfig = {
  operatingRooms: 2,
  totalBeds: 58,
  diagnosticEquipment: DEFAULT_EQUIPMENT,
  shiftTemplates: DEFAULT_SHIFTS,
  staffPool: DEFAULT_STAFF_POOL,
};

interface SettingsStore extends HospitalConfig {
  updateOperatingRooms: (count: number) => void;
  updateTotalBeds: (count: number) => void;
  updateEquipment: (equipment: DiagnosticEquipment[]) => void;
  updateShiftTemplates: (shifts: ShiftTemplate[]) => void;
  updateStaffPool: (pool: Record<RoleName, number>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,

      updateOperatingRooms: (count) => set({ operatingRooms: count }),

      updateTotalBeds: (count) => set({ totalBeds: count }),

      updateEquipment: (equipment) => set({ diagnosticEquipment: equipment }),

      updateShiftTemplates: (shifts) => set({ shiftTemplates: shifts }),

      updateStaffPool: (pool) => set({ staffPool: pool }),

      resetToDefaults: () => set({ ...DEFAULT_CONFIG }),
    }),
    {
      name: "ed-staffing-settings",
    },
  ),
);
