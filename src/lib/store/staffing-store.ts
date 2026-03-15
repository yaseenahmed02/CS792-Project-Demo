import { create } from "zustand";
import type {
  BlockId,
  BlockDecisionState,
  RoleStaffing,
  StaffingProposal,
} from "@/lib/types";

interface StaffingStore {
  decisions: Record<BlockId, BlockDecisionState>;
  initializeFromProposal: (proposal: StaffingProposal) => void;
  acceptBlock: (blockId: BlockId) => void;
  declineBlock: (blockId: BlockId, reason: string) => void;
  applyManualOverride: (blockId: BlockId, staffing: RoleStaffing[]) => void;
  applyReSuggestion: (blockId: BlockId, staffing: RoleStaffing[]) => void;
  resetBlock: (blockId: BlockId) => void;
  allDecided: () => boolean;
}

function createEmptyDecisions(): Record<BlockId, BlockDecisionState> {
  return {} as Record<BlockId, BlockDecisionState>;
}

export const useStaffingStore = create<StaffingStore>((set, get) => ({
  decisions: createEmptyDecisions(),

  initializeFromProposal: (proposal) => {
    const decisions: Record<string, BlockDecisionState> = {};

    for (const block of proposal.blocks) {
      decisions[block.blockId] = {
        blockId: block.blockId,
        decision: "pending",
        originalProposal: [...block.roles],
        currentStaffing: [...block.roles],
      };
    }

    set({ decisions: decisions as Record<BlockId, BlockDecisionState> });
  },

  acceptBlock: (blockId) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [blockId]: {
          ...state.decisions[blockId],
          decision: "accepted" as const,
          decidedAt: new Date().toISOString(),
        },
      },
    })),

  declineBlock: (blockId, reason) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [blockId]: {
          ...state.decisions[blockId],
          decision: "declined" as const,
          decidedAt: new Date().toISOString(),
          declineReason: reason,
        },
      },
    })),

  applyManualOverride: (blockId, staffing) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [blockId]: {
          ...state.decisions[blockId],
          decision: "manual" as const,
          decidedAt: new Date().toISOString(),
          currentStaffing: staffing,
        },
      },
    })),

  applyReSuggestion: (blockId, staffing) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [blockId]: {
          ...state.decisions[blockId],
          decision: "re-suggested" as const,
          decidedAt: new Date().toISOString(),
          currentStaffing: staffing,
        },
      },
    })),

  resetBlock: (blockId) =>
    set((state) => {
      const existing = state.decisions[blockId];
      if (!existing) return state;

      return {
        decisions: {
          ...state.decisions,
          [blockId]: {
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
    const blockIds = Object.keys(decisions);
    if (blockIds.length === 0) return false;
    return blockIds.every((id) => decisions[id as BlockId].decision !== "pending");
  },
}));
