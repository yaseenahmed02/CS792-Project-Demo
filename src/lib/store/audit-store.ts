import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditEntry, ShiftId } from "@/lib/types";

interface AuditStore {
  entries: AuditEntry[];
  addEntry: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;
  getEntriesForShift: (shiftId: ShiftId) => AuditEntry[];
  clearEntries: () => void;
}

function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEMO_ENTRIES: AuditEntry[] = [
  {
    id: "demo-1",
    timestamp: new Date(Date.now() - 3600_000 * 2).toISOString(),
    eventType: "proposal_generated",
    summary: "Staffing proposal generated for lean risk posture",
    detail: {
      decisionMaker: "System",
      riskPosture: "normal",
      scenarios: { influenzaOutbreak: false, majorIncident: false },
      forecastContext: { peakOccupancy: 42, peakArrivals: 11 },
    },
  },
  {
    id: "demo-2",
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
    eventType: "shift_accepted",
    shiftId: "day",
    summary: "Day Shift (07:00 - 15:00) accepted by charge nurse",
    detail: {
      decisionMaker: "Charge Nurse",
      riskPosture: "normal",
      scenarios: { influenzaOutbreak: false, majorIncident: false },
    },
  },
  {
    id: "demo-3",
    timestamp: new Date(Date.now() - 1800_000).toISOString(),
    eventType: "manual_override",
    shiftId: "evening",
    summary: "Evening Shift (15:00 - 23:00) manually adjusted - added 1 Emergency Nurse",
    detail: {
      decisionMaker: "Charge Nurse",
      riskPosture: "normal",
      scenarios: { influenzaOutbreak: false, majorIncident: false },
      manualOverrides: [{ role: "Emergency Nurse", from: 5, to: 6 }],
    },
  },
  {
    id: "demo-4",
    timestamp: new Date(Date.now() - 900_000).toISOString(),
    eventType: "re_suggest_requested",
    shiftId: "night",
    summary: "Re-suggestion requested for Night Shift with min 3 Attending Physicians",
    detail: {
      decisionMaker: "Charge Nurse",
      riskPosture: "elevated",
      scenarios: { influenzaOutbreak: true, majorIncident: false },
      constraints: [{ role: "Attending Physician", type: "min", value: 3 }],
    },
  },
];

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      entries: DEMO_ENTRIES,

      addEntry: (entry) => {
        const newEntry: AuditEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));
      },

      getEntriesForShift: (shiftId) => {
        return get().entries.filter((e) => e.shiftId === shiftId);
      },

      clearEntries: () => set({ entries: [] }),
    }),
    {
      name: "ed-staffing-audit-log",
    },
  ),
);
