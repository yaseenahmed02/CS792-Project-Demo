"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BlockId, RoleStaffing, StaffingConstraint } from "@/lib/types";
import { ManualEntryForm } from "./manual-entry-form";
import { ConstraintForm } from "./constraint-form";
import { ReSuggestPanel } from "./re-suggest-panel";

type ModalView = "reason" | "manual" | "constraints" | "re-suggest";

interface DeclineModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: BlockId;
  currentStaffing: RoleStaffing[];
  onDeclineWithManual: (reason: string, staffing: RoleStaffing[]) => void;
  onDeclineWithReSuggest: (
    reason: string,
    constraints: StaffingConstraint[],
    revisedStaffing: RoleStaffing[],
  ) => void;
}

/**Modal dialog for declining a block with manual entry or re-suggest options.*/
export function DeclineModal({
  isOpen,
  onClose,
  blockId,
  currentStaffing,
  onDeclineWithManual,
  onDeclineWithReSuggest,
}: DeclineModalProps) {
  const [view, setView] = useState<ModalView>("reason");
  const [reason, setReason] = useState("");
  const [constraints, setConstraints] = useState<StaffingConstraint[]>([]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetState();
      onClose();
    }
  }

  function resetState() {
    setView("reason");
    setReason("");
    setConstraints([]);
  }

  function handleManualSubmit(staffing: RoleStaffing[]) {
    onDeclineWithManual(reason, staffing);
    resetState();
    onClose();
  }

  function handleConstraintSubmit(newConstraints: StaffingConstraint[]) {
    setConstraints(newConstraints);
    setView("re-suggest");
  }

  function handleAcceptRevised(staffing: RoleStaffing[]) {
    onDeclineWithReSuggest(reason, constraints, staffing);
    resetState();
    onClose();
  }

  function handleKeepOriginal() {
    setView("reason");
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Decline block {blockId}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {getViewDescription(view)}
          </DialogDescription>
        </DialogHeader>

        {view === "reason" && (
          <ReasonView
            reason={reason}
            onReasonChange={setReason}
            onManual={() => setView("manual")}
            onReSuggest={() => setView("constraints")}
            onCancel={() => {
              resetState();
              onClose();
            }}
          />
        )}

        {view === "manual" && (
          <ManualEntryForm
            currentStaffing={currentStaffing}
            onSubmit={handleManualSubmit}
            onCancel={() => setView("reason")}
          />
        )}

        {view === "constraints" && (
          <ConstraintForm
            onSubmit={handleConstraintSubmit}
            onCancel={() => setView("reason")}
          />
        )}

        {view === "re-suggest" && (
          <ReSuggestPanel
            blockId={blockId}
            originalStaffing={currentStaffing}
            constraints={constraints}
            onAcceptRevised={handleAcceptRevised}
            onKeepOriginal={handleKeepOriginal}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonView({
  reason,
  onReasonChange,
  onManual,
  onReSuggest,
  onCancel,
}: {
  reason: string;
  onReasonChange: (reason: string) => void;
  onManual: () => void;
  onReSuggest: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="decline-reason"
          className="mb-1.5 block text-sm text-muted-foreground"
        >
          Reason for declining (optional)
        </label>
        <textarea
          id="decline-reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="e.g., Need more nurses due to expected surge..."
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onManual}
          className="flex-1 rounded-md border px-3 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <p className="text-sm font-medium text-foreground">
            Enter manually
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Set staffing numbers yourself
          </p>
        </button>
        <button
          onClick={onReSuggest}
          className="flex-1 rounded-md border px-3 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <p className="text-sm font-medium text-foreground">
            Re-suggest with constraints
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Let the system revise with your rules
          </p>
        </button>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function getViewDescription(view: ModalView): string {
  switch (view) {
    case "reason":
      return "Provide a reason and choose how to proceed.";
    case "manual":
      return "Set staffing numbers for each role manually.";
    case "constraints":
      return "Add constraints for the revised proposal.";
    case "re-suggest":
      return "Review the revised staffing proposal.";
  }
}
