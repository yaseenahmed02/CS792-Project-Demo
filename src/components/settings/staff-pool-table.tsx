"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/lib/store";
import { ROLES } from "@/lib/constants/roles";
import { CTAS_LEVELS } from "@/lib/constants/ctas";
import type { RoleName } from "@/lib/types";
import type { RoleConfig } from "@/lib/constants/roles";

const MIN_STAFF = 1;
const MAX_STAFF = 50;

/**CTAS level dots showing which levels a role serves.*/
function CTASIndicators({ levels }: { levels: number[] }) {
  return (
    <div className="flex gap-1">
      {levels.map((level) => {
        const ctas = CTAS_LEVELS.find((c) => c.level === level);
        return (
          <span
            key={level}
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: ctas?.color ?? "#888" }}
            title={`CTAS ${level}`}
          />
        );
      })}
    </div>
  );
}

/**Single staff role row with editable max count.*/
function StaffRow({
  role,
  count,
  onUpdateCount,
}: {
  role: RoleConfig;
  count: number;
  onUpdateCount: (value: number) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) return;
    onUpdateCount(Math.min(MAX_STAFF, Math.max(MIN_STAFF, raw)));
  }

  return (
    <tr className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{role.name}</span>
          <Badge variant="outline" className="text-[10px]">
            min {role.minStaff}
          </Badge>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <CTASIndicators levels={role.requiredForCTAS} />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min={MIN_STAFF}
          max={MAX_STAFF}
          value={count}
          onChange={handleChange}
          className="h-8 w-16 rounded-[7px] border bg-background px-2 text-sm text-foreground text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </td>
    </tr>
  );
}

/**Staff pool table: role name, CTAS coverage, and max available per shift.*/
export function StaffPoolTable() {
  const staffPool = useSettingsStore((s) => s.staffPool);
  const updateStaffPool = useSettingsStore((s) => s.updateStaffPool);

  function handleUpdateRole(roleName: RoleName, count: number) {
    updateStaffPool({ ...staffPool, [roleName]: count });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Pool</CardTitle>
        <CardDescription>
          Maximum staff available per shift for each role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">CTAS Coverage</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Max per Shift</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <StaffRow
                  key={role.name}
                  role={role}
                  count={staffPool[role.name] ?? role.minStaff}
                  onUpdateCount={(count) => handleUpdateRole(role.name, count)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
