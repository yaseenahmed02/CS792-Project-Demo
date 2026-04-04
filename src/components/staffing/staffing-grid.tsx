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
  ShiftId,
  ShiftDecisionState,
  StaffingShift,
  StaffingConstraint,
  RoleStaffing,
  RoleName,
} from "@/lib/types";
import { useStaffingStore, useAuditStore, useScenarioStore } from "@/lib/store";
import { formatDelta, formatTimeRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { ShiftActions } from "./shift-actions";
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

const CATEGORY_BADGE: Record<string, string> = {
  core: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  swing: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  flex: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
};

interface StaffingGridProps {
  shifts: StaffingShift[];
  decisions: Record<ShiftId, ShiftDecisionState>;
}

/**Shift-column x role-row staffing grid with accept/decline workflow.*/
export function StaffingGrid({ shifts, decisions }: StaffingGridProps) {
  const [declineShiftId, setDeclineShiftId] = useState<ShiftId | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftId | null>(null);

  const acceptShift = useStaffingStore((s) => s.acceptShift);
  const declineShift = useStaffingStore((s) => s.declineShift);
  const applyManualOverride = useStaffingStore((s) => s.applyManualOverride);
  const applyReSuggestion = useStaffingStore((s) => s.applyReSuggestion);
  const resetShift = useStaffingStore((s) => s.resetShift);
  const addAuditEntry = useAuditStore((s) => s.addEntry);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const riskPosture = useScenarioStore((s) => s.riskPosture);

  const roleNames = shifts[0]?.roles.map((r) => r.role) ?? [];

  function handleAccept(shiftId: ShiftId) {
    acceptShift(shiftId);
    addAuditEntry({
      eventType: "shift_accepted",
      shiftId,
      summary: `Shift ${shiftId} accepted`,
      detail: { decisionMaker: "Charge Nurse", riskPosture, scenarios },
    });
    toast.success(`Shift ${shiftId} accepted`);
  }

  function handleReset(shiftId: ShiftId) {
    resetShift(shiftId);
    toast.info(`Shift ${shiftId} reset to pending`);
  }

  function handleDeclineWithManual(
    shiftId: ShiftId,
    reason: string,
    staffing: RoleStaffing[],
  ) {
    declineShift(shiftId, reason);
    applyManualOverride(shiftId, staffing);
    addAuditEntry({
      eventType: "manual_override",
      shiftId,
      summary: `Shift ${shiftId} declined with manual override`,
      detail: {
        decisionMaker: "Charge Nurse",
        riskPosture,
        scenarios,
        declineReason: reason,
        originalStaffing: decisions[shiftId]?.originalProposal,
        revisedStaffing: staffing,
      },
    });
    toast.info(`Shift ${shiftId} manually overridden`);
  }

  function handleDeclineWithReSuggest(
    shiftId: ShiftId,
    reason: string,
    constraints: StaffingConstraint[],
    revised: RoleStaffing[],
  ) {
    declineShift(shiftId, reason);
    applyReSuggestion(shiftId, revised);
    addAuditEntry({
      eventType: "re_suggest_accepted",
      shiftId,
      summary: `Shift ${shiftId} re-suggested and accepted`,
      detail: {
        decisionMaker: "Charge Nurse",
        riskPosture,
        scenarios,
        declineReason: reason,
        constraints,
        originalStaffing: decisions[shiftId]?.originalProposal,
        revisedStaffing: revised,
      },
    });
    toast.success(`Shift ${shiftId} revised proposal accepted`);
  }

  const declineModalState = declineShiftId
    ? decisions[declineShiftId]
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
              {shifts.map((shift) => (
                <ShiftColumnHeader
                  key={shift.shiftId}
                  shift={shift}
                  decision={decisions[shift.shiftId]?.decision ?? "pending"}
                  isSelected={selectedShift === shift.shiftId}
                  onSelect={() =>
                    setSelectedShift(
                      selectedShift === shift.shiftId ? null : shift.shiftId,
                    )
                  }
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {roleNames.map((roleName) => (
              <tr key={roleName} className="border-b last:border-b-0">
                <td className="sticky left-0 z-10 bg-background px-4 py-2">
                  <RoleLabel roleName={roleName} />
                </td>
                {shifts.map((shift) => {
                  const state = decisions[shift.shiftId];
                  const role = state
                    ? state.currentStaffing.find((r) => r.role === roleName)
                    : shift.roles.find((r) => r.role === roleName);

                  if (!role) return <td key={shift.shiftId} />;

                  return (
                    <StaffingCell
                      key={shift.shiftId}
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
              {shifts.map((shift) => {
                const decision =
                  decisions[shift.shiftId]?.decision ?? "pending";
                return (
                  <td key={shift.shiftId} className="px-3 py-2 text-center">
                    <ShiftActions
                      shiftId={shift.shiftId}
                      decision={decision}
                      onAccept={() => handleAccept(shift.shiftId)}
                      onDecline={() => setDeclineShiftId(shift.shiftId)}
                      onReset={() => handleReset(shift.shiftId)}
                      onManualEntry={() => setDeclineShiftId(shift.shiftId)}
                      onReSuggest={() => setDeclineShiftId(shift.shiftId)}
                    />
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {selectedShift && (
        <div className="border-t px-4 py-4">
          <RationalePanel
            shift={shifts.find((s) => s.shiftId === selectedShift)!}
            riskPosture={riskPosture}
            scenarios={scenarios}
          />
        </div>
      )}

      {declineShiftId && declineModalState && (
        <DeclineModal
          isOpen={!!declineShiftId}
          onClose={() => setDeclineShiftId(null)}
          shiftId={declineShiftId}
          currentStaffing={declineModalState.currentStaffing}
          onDeclineWithManual={(reason, staffing) =>
            handleDeclineWithManual(declineShiftId, reason, staffing)
          }
          onDeclineWithReSuggest={(reason, constraints, revised) =>
            handleDeclineWithReSuggest(
              declineShiftId,
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

function ShiftColumnHeader({
  shift,
  decision,
  isSelected,
  onSelect,
}: {
  shift: StaffingShift;
  decision: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <th className="min-w-[120px] px-3 py-2.5 text-center">
      <button
        onClick={onSelect}
        className={cn(
          "inline-flex w-full flex-col items-center gap-0.5",
          isSelected && "opacity-100",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">
            {shift.name}
          </span>
          <div
            className={cn("h-1 w-1 rounded-full", DECISION_DOT[decision])}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {formatTimeRange(shift.startHour, shift.endHour)}
        </span>
        <span
          className={cn(
            "mt-0.5 rounded-full px-1.5 py-px text-[9px] font-medium",
            CATEGORY_BADGE[shift.category],
          )}
        >
          {shift.category}
        </span>
      </button>
    </th>
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
