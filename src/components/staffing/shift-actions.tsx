"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShiftId, ShiftDecision } from "@/lib/types";

interface ShiftActionsProps {
  shiftId: ShiftId;
  decision: ShiftDecision;
  onAccept: () => void;
  onDecline: () => void;
  onReset: () => void;
  onManualEntry: () => void;
  onReSuggest: () => void;
}

/**Action buttons for each shift column, adapting to current decision state.*/
export function ShiftActions({
  decision,
  onAccept,
  onDecline,
  onReset,
  onManualEntry,
  onReSuggest,
}: ShiftActionsProps) {
  if (decision === "pending") {
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onAccept}
          className="h-7 px-2.5 text-xs"
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDecline}
          className="h-7 px-2.5 text-xs text-muted-foreground"
        >
          Decline
        </Button>
      </div>
    );
  }

  if (decision === "accepted") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <Check className="h-3 w-3 text-emerald-600" />
        <span className="text-xs text-muted-foreground">Accepted</span>
        <button
          onClick={onReset}
          className="ml-1 text-[10px] text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground"
        >
          Reset
        </button>
      </div>
    );
  }

  if (decision === "declined") {
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onManualEntry}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Manual
        </button>
        <button
          onClick={onReSuggest}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Re-suggest
        </button>
      </div>
    );
  }

  // manual or re-suggested
  const label = decision === "manual" ? "Manual" : "Revised";

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        onClick={onReset}
        className="text-[10px] text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground"
      >
        Reset
      </button>
    </div>
  );
}
