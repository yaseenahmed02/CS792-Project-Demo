import { create } from "zustand";
import type {
  ShiftId,
  ShiftDecisionState,
  RoleStaffing,
  StaffingProposal,
} from "@/lib/types";

interface StaffingStore {
  decisions: Record<ShiftId, ShiftDecisionState>;
  initializeFromProposal: (proposal: StaffingProposal) => void;
  acceptShift: (shiftId: ShiftId) => void;
  declineShift: (shiftId: ShiftId, reason: string) => void;
  applyManualOverride: (shiftId: ShiftId, staffing: RoleStaffing[]) => void;
  applyReSuggestion: (shiftId: ShiftId, staffing: RoleStaffing[]) => void;
  resetShift: (shiftId: ShiftId) => void;
  allDecided: () => boolean;
}

export const useStaffingStore = create<StaffingStore>((set, get) => ({
  decisions: {},

  initializeFromProposal: (proposal) => {
    const decisions: Record<string, ShiftDecisionState> = {};

    for (const shift of proposal.shifts) {
      decisions[shift.shiftId] = {
        shiftId: shift.shiftId,
        decision: "pending",
        originalProposal: [...shift.roles],
        currentStaffing: [...shift.roles],
      };
    }

    set({ decisions });
  },

  acceptShift: (shiftId) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [shiftId]: {
          ...state.decisions[shiftId],
          decision: "accepted" as const,
          decidedAt: new Date().toISOString(),
        },
      },
    })),

  declineShift: (shiftId, reason) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [shiftId]: {
          ...state.decisions[shiftId],
          decision: "declined" as const,
          decidedAt: new Date().toISOString(),
          declineReason: reason,
        },
      },
    })),

  applyManualOverride: (shiftId, staffing) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [shiftId]: {
          ...state.decisions[shiftId],
          decision: "manual" as const,
          decidedAt: new Date().toISOString(),
          currentStaffing: staffing,
        },
      },
    })),

  applyReSuggestion: (shiftId, staffing) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [shiftId]: {
          ...state.decisions[shiftId],
          decision: "re-suggested" as const,
          decidedAt: new Date().toISOString(),
          currentStaffing: staffing,
        },
      },
    })),

  resetShift: (shiftId) =>
    set((state) => {
      const existing = state.decisions[shiftId];
      if (!existing) return state;

      return {
        decisions: {
          ...state.decisions,
          [shiftId]: {
            ...existing,
            decision: "pending" as const,
            decidedAt: undefined,
            currentStaffing: [...existing.originalProposal],
            declineReason: undefined,
            constraints: undefined,
          },
        },
      };
    }),

  allDecided: () => {
    const decisions = get().decisions;
    const shiftIds = Object.keys(decisions);
    if (shiftIds.length === 0) return false;
    return shiftIds.every((id) => decisions[id].decision !== "pending");
  },
}));
