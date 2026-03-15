"use client";

import { useState } from "react";
import {
  Stethoscope,
  Heart,
  ClipboardList,
  GraduationCap,
  Scissors,
  Scan,
  Wind,
  Users,
  Shield,
} from "lucide-react";
import type {
  BlockId,
  BlockDecisionState,
  StaffingBlock,
  StaffingConstraint,
  RoleStaffing,
  RoleName,
} from "@/lib/types";
import { useStaffingStore, useAuditStore, useScenarioStore } from "@/lib/store";
import { formatDelta } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { BlockActions } from "./block-actions";
import { DeclineModal } from "./decline-modal";
import { RationalePanel } from "./rationale-panel";

const ROLE_ICONS: Record<string, React.ElementType> = {
  Stethoscope, Heart, ClipboardList, GraduationCap,
  Scissors, Scan, Wind, Users, Shield,
};

const ICON_FOR_ROLE: Record<RoleName, string> = {
  "Attending Physician": "Stethoscope",
  "Emergency Nurse": "Heart",
  "Triage Nurse": "ClipboardList",
  Resident: "GraduationCap",
  "Trauma Surgeon": "Scissors",
  Radiologist: "Scan",
  "Respiratory Therapist": "Wind",
  "Social Worker": "Users",
  "Security Officer": "Shield",
};

const DECISION_DOT: Record<string, string> = {
  pending: "bg-muted-foreground/30",
  accepted: "bg-emerald-500",
  declined: "bg-rose-500",
  manual: "bg-blue-500",
  "re-suggested": "bg-amber-500",
};

interface StaffingGridProps {
  blocks: StaffingBlock[];
  decisions: Record<BlockId, BlockDecisionState>;
}

/**6-column x 9-row staffing grid with clean tabular layout.*/
export function StaffingGrid({ blocks, decisions }: StaffingGridProps) {
  const [declineBlockId, setDeclineBlockId] = useState<BlockId | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockId | null>(null);

  const acceptBlock = useStaffingStore((s) => s.acceptBlock);
  const declineBlock = useStaffingStore((s) => s.declineBlock);
  const applyManualOverride = useStaffingStore((s) => s.applyManualOverride);
  const applyReSuggestion = useStaffingStore((s) => s.applyReSuggestion);
  const resetBlock = useStaffingStore((s) => s.resetBlock);
  const addAuditEntry = useAuditStore((s) => s.addEntry);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const riskPosture = useScenarioStore((s) => s.riskPosture);

  const roleNames = blocks[0]?.roles.map((r) => r.role) ?? [];

  function handleAccept(blockId: BlockId) {
    acceptBlock(blockId);
    addAuditEntry({
      eventType: "block_accepted",
      blockId,
      summary: `Block ${blockId} accepted`,
      detail: { decisionMaker: "Charge Nurse", riskPosture, scenarios },
    });
    toast.success(`Block ${blockId} accepted`);
  }

  function handleReset(blockId: BlockId) {
    resetBlock(blockId);
    toast.info(`Block ${blockId} reset to pending`);
  }

  function handleDeclineWithManual(
    blockId: BlockId,
    reason: string,
    staffing: RoleStaffing[],
  ) {
    declineBlock(blockId, reason);
    applyManualOverride(blockId, staffing);
    addAuditEntry({
      eventType: "manual_override",
      blockId,
      summary: `Block ${blockId} declined with manual override`,
      detail: {
        decisionMaker: "Charge Nurse",
        riskPosture,
        scenarios,
        declineReason: reason,
        originalStaffing: decisions[blockId]?.originalProposal,
        revisedStaffing: staffing,
      },
    });
    toast.info(`Block ${blockId} manually overridden`);
  }

  function handleDeclineWithReSuggest(
    blockId: BlockId,
    reason: string,
    constraints: StaffingConstraint[],
    revised: RoleStaffing[],
  ) {
    declineBlock(blockId, reason);
    applyReSuggestion(blockId, revised);
    addAuditEntry({
      eventType: "re_suggest_accepted",
      blockId,
      summary: `Block ${blockId} re-suggested and accepted`,
      detail: {
        decisionMaker: "Charge Nurse",
        riskPosture,
        scenarios,
        declineReason: reason,
        constraints,
        originalStaffing: decisions[blockId]?.originalProposal,
        revisedStaffing: revised,
      },
    });
    toast.success(`Block ${blockId} revised proposal accepted`);
  }

  const declineModalBlock = declineBlockId
    ? decisions[declineBlockId]
    : null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 w-44 bg-background px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Role
              </th>
              {blocks.map((block) => {
                const decision = decisions[block.blockId]?.decision ?? "pending";
                return (
                  <th
                    key={block.blockId}
                    className="min-w-[110px] px-3 py-2.5 text-center"
                  >
                    <button
                      onClick={() =>
                        setSelectedBlock(
                          selectedBlock === block.blockId
                            ? null
                            : block.blockId,
                        )
                      }
                      className="inline-flex w-full flex-col items-center gap-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">
                          {block.blockId}
                        </span>
                        <div
                          className={cn(
                            "h-1 w-1 rounded-full",
                            DECISION_DOT[decision],
                          )}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {block.label}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {roleNames.map((roleName) => (
              <tr key={roleName} className="border-b last:border-b-0">
                <td className="sticky left-0 z-10 bg-background px-4 py-2">
                  <RoleLabel roleName={roleName} />
                </td>
                {blocks.map((block) => {
                  const state = decisions[block.blockId];
                  const role = state
                    ? state.currentStaffing.find((r) => r.role === roleName)
                    : block.roles.find((r) => r.role === roleName);

                  if (!role) return <td key={block.blockId} />;

                  return (
                    <StaffingCell
                      key={block.blockId}
                      headcount={role.headcount}
                      delta={role.delta}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="sticky left-0 z-10 bg-background px-4 py-2 text-xs font-medium text-muted-foreground">
                Actions
              </td>
              {blocks.map((block) => {
                const decision =
                  decisions[block.blockId]?.decision ?? "pending";
                return (
                  <td
                    key={block.blockId}
                    className="px-3 py-2 text-center"
                  >
                    <BlockActions
                      blockId={block.blockId}
                      decision={decision}
                      onAccept={() => handleAccept(block.blockId)}
                      onDecline={() => setDeclineBlockId(block.blockId)}
                      onReset={() => handleReset(block.blockId)}
                      onManualEntry={() => setDeclineBlockId(block.blockId)}
                      onReSuggest={() => setDeclineBlockId(block.blockId)}
                    />
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {selectedBlock && (
        <div className="border-t px-4 py-4">
          <RationalePanel
            block={blocks.find((b) => b.blockId === selectedBlock)!}
            riskPosture={riskPosture}
            scenarios={scenarios}
          />
        </div>
      )}

      {declineBlockId && declineModalBlock && (
        <DeclineModal
          isOpen={!!declineBlockId}
          onClose={() => setDeclineBlockId(null)}
          blockId={declineBlockId}
          currentStaffing={declineModalBlock.currentStaffing}
          onDeclineWithManual={(reason, staffing) =>
            handleDeclineWithManual(declineBlockId, reason, staffing)
          }
          onDeclineWithReSuggest={(reason, constraints, revised) =>
            handleDeclineWithReSuggest(
              declineBlockId,
              reason,
              constraints,
              revised,
            )
          }
        />
      )}
    </>
  );
}

function RoleLabel({ roleName }: { roleName: RoleName }) {
  const iconName = ICON_FOR_ROLE[roleName];
  const IconComponent = ROLE_ICONS[iconName];

  return (
    <div className="flex items-center gap-2">
      {IconComponent && (
        <IconComponent className="h-3.5 w-3.5 text-muted-foreground/60" />
      )}
      <span className="text-sm text-foreground">{roleName}</span>
    </div>
  );
}

function StaffingCell({
  headcount,
  delta,
}: {
  headcount: number;
  delta: number;
}) {
  return (
    <td className="px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-sm font-medium tabular-nums text-foreground">
          {headcount}
        </span>
        {delta !== 0 && (
          <span
            className={cn(
              "text-xs tabular-nums",
              delta > 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {formatDelta(delta)}
          </span>
        )}
      </div>
    </td>
  );
}
