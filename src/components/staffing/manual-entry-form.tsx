"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoleStaffing, RoleName } from "@/lib/types";
import { ROLES } from "@/lib/constants";
import { formatDelta } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface ManualEntryFormProps {
  currentStaffing: RoleStaffing[];
  onSubmit: (staffing: RoleStaffing[]) => void;
  onCancel: () => void;
}

/**Form for manually entering staffing numbers per role with +/- controls.*/
export function ManualEntryForm({
  currentStaffing,
  onSubmit,
  onCancel,
}: ManualEntryFormProps) {
  const [counts, setCounts] = useState<Record<RoleName, number>>(() =>
    buildInitialCounts(currentStaffing),
  );

  const totalProposed = currentStaffing.reduce((s, r) => s + r.headcount, 0);
  const totalManual = Object.values(counts).reduce((s, c) => s + c, 0);
  const totalDelta = totalManual - totalProposed;

  function handleIncrement(role: RoleName) {
    setCounts((prev) => ({ ...prev, [role]: prev[role] + 1 }));
  }

  function handleDecrement(role: RoleName) {
    const minStaff = ROLES.find((r) => r.name === role)?.minStaff ?? 1;
    setCounts((prev) => ({
      ...prev,
      [role]: Math.max(minStaff, prev[role] - 1),
    }));
  }

  function handleSubmit() {
    const staffing: RoleStaffing[] = currentStaffing.map((original) => {
      const newCount = counts[original.role];
      return {
        ...original,
        headcount: newCount,
        previousHeadcount: original.headcount,
        delta: newCount - original.headcount,
        rationale: `Manual override: set to ${newCount} (was ${original.headcount})`,
      };
    });
    onSubmit(staffing);
  }

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-1.5 text-left text-xs font-medium text-muted-foreground">
              Role
            </th>
            <th className="py-1.5 text-center text-xs font-medium text-muted-foreground">
              Proposed
            </th>
            <th className="py-1.5 text-center text-xs font-medium text-muted-foreground">
              Override
            </th>
            <th className="py-1.5 text-right text-xs font-medium text-muted-foreground">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {currentStaffing.map((role) => {
            const minStaff =
              ROLES.find((r) => r.name === role.role)?.minStaff ?? 1;
            const delta = counts[role.role] - role.headcount;

            return (
              <tr key={role.role} className="border-b last:border-b-0">
                <td className="py-2 text-sm text-foreground">
                  {role.role}
                </td>
                <td className="py-2 text-center text-sm tabular-nums text-muted-foreground">
                  {role.headcount}
                </td>
                <td className="py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleDecrement(role.role)}
                      disabled={counts[role.role] <= minStaff}
                      className="flex h-6 w-6 items-center justify-center rounded border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {counts[role.role]}
                    </span>
                    <button
                      onClick={() => handleIncrement(role.role)}
                      className="flex h-6 w-6 items-center justify-center rounded border text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="py-2 text-right">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="text-xs text-muted-foreground">
          Total: <span className="font-medium text-foreground">{totalManual}</span>
          {totalDelta !== 0 && (
            <span
              className={cn(
                "ml-1.5",
                totalDelta > 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              ({formatDelta(totalDelta)})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
            Back
          </Button>
          <Button size="sm" onClick={handleSubmit} className="text-xs">
            Apply override
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildInitialCounts(
  staffing: RoleStaffing[],
): Record<RoleName, number> {
  const counts = {} as Record<RoleName, number>;
  for (const role of staffing) {
    counts[role.role] = role.headcount;
  }
  return counts;
}
