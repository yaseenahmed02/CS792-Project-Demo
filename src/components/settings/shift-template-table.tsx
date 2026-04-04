"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSettingsStore } from "@/lib/store";
import type { ShiftTemplate } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const HOURS_IN_DAY = 24;
const TIMELINE_LABEL_INTERVAL = 6;

const CATEGORY_COLORS: Record<ShiftTemplate["category"], string> = {
  core: "bg-blue-500/80 dark:bg-blue-400/70",
  swing: "bg-amber-500/80 dark:bg-amber-400/70",
  flex: "bg-emerald-500/80 dark:bg-emerald-400/70",
};

const CATEGORY_BADGE_VARIANT: Record<ShiftTemplate["category"], "default" | "warning" | "success"> = {
  core: "default",
  swing: "warning",
  flex: "success",
};

/**Format hour as 24h string (e.g. 07:00, 23:00).*/
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**Calculate shift duration in hours, handling overnight wraps.*/
function calculateShiftDuration(shift: ShiftTemplate): number {
  if (shift.isOvernight) {
    return HOURS_IN_DAY - shift.startHour + shift.endHour;
  }
  return shift.endHour - shift.startHour;
}

/**Single shift bar positioned on the 24h timeline.*/
function ShiftBar({ shift }: { shift: ShiftTemplate }) {
  const leftPercent = (shift.startHour / HOURS_IN_DAY) * 100;
  const duration = calculateShiftDuration(shift);
  const widthPercent = (duration / HOURS_IN_DAY) * 100;

  // Overnight shifts wrap: render two segments
  if (shift.isOvernight) {
    const firstWidth = ((HOURS_IN_DAY - shift.startHour) / HOURS_IN_DAY) * 100;
    const secondWidth = (shift.endHour / HOURS_IN_DAY) * 100;
    return (
      <>
        <div
          className={cn("absolute top-0 h-full rounded-r-sm opacity-90", CATEGORY_COLORS[shift.category])}
          style={{ left: `${leftPercent}%`, width: `${firstWidth}%` }}
          title={`${shift.name} (${formatHour(shift.startHour)} - ${formatHour(shift.endHour)})`}
        />
        <div
          className={cn("absolute top-0 h-full rounded-l-sm opacity-90", CATEGORY_COLORS[shift.category])}
          style={{ left: "0%", width: `${secondWidth}%` }}
          title={`${shift.name} (cont.)`}
        />
      </>
    );
  }

  return (
    <div
      className={cn("absolute top-0 h-full rounded-sm opacity-90", CATEGORY_COLORS[shift.category])}
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
      title={`${shift.name} (${formatHour(shift.startHour)} - ${formatHour(shift.endHour)})`}
    />
  );
}

/**24-hour visual timeline showing all shifts with overlap.*/
function ShiftTimeline({ shifts }: { shifts: ShiftTemplate[] }) {
  const labels = Array.from(
    { length: HOURS_IN_DAY / TIMELINE_LABEL_INTERVAL + 1 },
    (_, i) => i * TIMELINE_LABEL_INTERVAL,
  );

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        24-hour coverage
      </p>
      <div className="relative rounded-lg border bg-muted/20 p-3">
        {/* Hour markers */}
        <div className="relative mb-1 flex justify-between">
          {labels.map((hour) => (
            <span key={hour} className="text-[10px] text-muted-foreground tabular-nums">
              {formatHour(hour)}
            </span>
          ))}
        </div>
        {/* Timeline bars */}
        <div className="relative h-6 rounded bg-muted/30">
          {shifts.map((shift) => (
            <ShiftBar key={shift.id} shift={shift} />
          ))}
        </div>
        {/* Legend */}
        <div className="mt-2 flex gap-4">
          {(["core", "swing", "flex"] as const).map((category) => (
            <div key={category} className="flex items-center gap-1.5">
              <span className={cn("inline-block h-2 w-2 rounded-sm", CATEGORY_COLORS[category])} />
              <span className="text-[10px] text-muted-foreground capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**Single shift row in the table.*/
function ShiftRow({
  shift,
  onRemove,
}: {
  shift: ShiftTemplate;
  onRemove: () => void;
}) {
  const duration = calculateShiftDuration(shift);

  return (
    <tr className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
      <td className="px-3 py-2.5 text-sm text-foreground">{shift.name}</td>
      <td className="px-3 py-2.5 text-sm text-foreground tabular-nums">
        {formatHour(shift.startHour)}
      </td>
      <td className="px-3 py-2.5 text-sm text-foreground tabular-nums">
        {formatHour(shift.endHour)}
      </td>
      <td className="px-3 py-2.5">
        <Badge variant={CATEGORY_BADGE_VARIANT[shift.category]}>
          {shift.category}
        </Badge>
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground tabular-nums text-right">
        {duration}h
      </td>
      <td className="px-3 py-2.5">
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </td>
    </tr>
  );
}

/**Creates a new shift template with a unique ID.*/
function createShiftTemplate(): ShiftTemplate {
  return {
    id: `shift-${Date.now()}`,
    name: "New Shift",
    startHour: 8,
    endHour: 16,
    isOvernight: false,
    category: "flex",
  };
}

/**Shift template management table with 24h visual timeline.*/
export function ShiftTemplateTable() {
  const shifts = useSettingsStore((s) => s.shiftTemplates);
  const updateShiftTemplates = useSettingsStore((s) => s.updateShiftTemplates);

  function handleRemoveShift(index: number) {
    updateShiftTemplates(shifts.filter((_, i) => i !== index));
  }

  function handleAddShift() {
    updateShiftTemplates([...shifts, createShiftTemplate()]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Templates</CardTitle>
        <CardDescription>
          Define shift windows used for staffing allocation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Start</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">End</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Duration</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift, index) => (
                <ShiftRow
                  key={shift.id}
                  shift={shift}
                  onRemove={() => handleRemoveShift(index)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleAddShift}>
          <Plus className="h-3.5 w-3.5" />
          Add shift
        </Button>
        <ShiftTimeline shifts={shifts} />
      </CardContent>
    </Card>
  );
}
