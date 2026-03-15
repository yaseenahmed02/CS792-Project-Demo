"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoleName, StaffingConstraint } from "@/lib/types";
import { ROLES } from "@/lib/constants";

interface ConstraintFormProps {
  onSubmit: (constraints: StaffingConstraint[]) => void;
  onCancel: () => void;
}

const CONSTRAINT_TYPES: { value: StaffingConstraint["type"]; label: string }[] = [
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "exact", label: "Exactly" },
];

interface ConstraintRow {
  id: string;
  role: RoleName;
  type: StaffingConstraint["type"];
  value: number;
}

/**Form for entering constraints before re-suggesting staffing.*/
export function ConstraintForm({ onSubmit, onCancel }: ConstraintFormProps) {
  const [rows, setRows] = useState<ConstraintRow[]>([createEmptyRow()]);

  function handleAddRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function handleRemoveRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleChangeRole(id: string, role: RoleName) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, role } : r)),
    );
  }

  function handleChangeType(id: string, type: StaffingConstraint["type"]) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, type } : r)),
    );
  }

  function handleChangeValue(id: string, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: Math.max(0, value) } : r)),
    );
  }

  function handleSubmit() {
    const constraints: StaffingConstraint[] = rows.map((r) => ({
      role: r.role,
      type: r.type,
      value: r.value,
    }));
    onSubmit(constraints);
  }

  const isValid = rows.length > 0 && rows.every((r) => r.value > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add constraints for the revised proposal. The system will try to
        satisfy all constraints while maintaining minimum staffing levels.
      </p>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-2"
          >
            <select
              value={row.role}
              onChange={(e) =>
                handleChangeRole(row.id, e.target.value as RoleName)
              }
              className="h-8 flex-1 rounded-md border bg-background px-2 text-sm"
            >
              {ROLES.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>

            <select
              value={row.type}
              onChange={(e) =>
                handleChangeType(
                  row.id,
                  e.target.value as StaffingConstraint["type"],
                )
              }
              className="h-8 w-28 rounded-md border bg-background px-2 text-sm"
            >
              {CONSTRAINT_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              value={row.value}
              onChange={(e) =>
                handleChangeValue(row.id, parseInt(e.target.value, 10) || 0)
              }
              className="h-8 w-16 rounded-md border bg-background px-2 text-center text-sm tabular-nums"
            />

            <button
              onClick={() => handleRemoveRow(row.id)}
              disabled={rows.length <= 1}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddRow}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Add constraint
      </button>

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          Back
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!isValid} className="text-xs">
          Re-suggest
        </Button>
      </div>
    </div>
  );
}

function createEmptyRow(): ConstraintRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: ROLES[0].name,
    type: "min",
    value: 1,
  };
}
