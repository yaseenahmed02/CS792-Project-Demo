"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { ShiftId, ShiftDecision, StaffingShift } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatHour } from "@/lib/utils/format";

const HOURS_IN_DAY = 24;
const HOUR_LABELS = Array.from({ length: 25 }, (_, i) => i);

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  core: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  swing: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  flex: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
  },
};

const DECISION_INDICATOR: Record<ShiftDecision, { icon: React.ReactNode; color: string }> = {
  pending: { icon: null, color: "bg-muted-foreground/30" },
  accepted: { icon: <Check className="h-2.5 w-2.5" />, color: "text-emerald-600" },
  declined: { icon: <X className="h-2.5 w-2.5" />, color: "text-rose-600" },
  manual: { icon: null, color: "text-blue-600" },
  "re-suggested": { icon: null, color: "text-amber-600" },
};

interface ShiftTimelineProps {
  shifts: StaffingShift[];
  decisions: Record<ShiftId, { decision: ShiftDecision }>;
  selectedShiftId?: ShiftId | null;
  onSelectShift?: (shiftId: ShiftId) => void;
}

/**Gantt-style 24h timeline showing overlapping shifts with decision indicators.*/
export function ShiftTimeline({
  shifts,
  decisions,
  selectedShiftId,
  onSelectShift,
}: ShiftTimelineProps) {
  const [currentHourFraction, setCurrentHourFraction] = useState(getCurrentHourFraction);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHourFraction(getCurrentHourFraction());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const lanes = assignLanes(shifts);
  const laneCount = Math.max(...lanes.map((l) => l.lane)) + 1;
  const currentPercent = (currentHourFraction / HOURS_IN_DAY) * 100;

  return (
    <div className="w-full">
      {/* Hour axis labels */}
      <div className="relative mb-1 h-4">
        {HOUR_LABELS.filter((h) => h % 3 === 0).map((hour) => (
          <span
            key={hour}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            style={{ left: `${(hour / HOURS_IN_DAY) * 100}%` }}
          >
            {formatHour(hour % 24)}
          </span>
        ))}
      </div>

      {/* Shift bars area */}
      <div
        className="relative border rounded-md bg-muted/20"
        style={{ height: `${laneCount * 32 + 8}px` }}
      >
        {/* Hour grid lines */}
        {HOUR_LABELS.filter((h) => h % 3 === 0 && h > 0 && h < 24).map((hour) => (
          <div
            key={`grid-${hour}`}
            className="absolute top-0 bottom-0 w-px bg-border/40"
            style={{ left: `${(hour / HOURS_IN_DAY) * 100}%` }}
          />
        ))}

        {/* Shift bars */}
        {lanes.map((item) => (
          <ShiftBar
            key={item.shift.shiftId}
            shift={item.shift}
            lane={item.lane}
            decision={decisions[item.shift.shiftId]?.decision ?? "pending"}
            isSelected={selectedShiftId === item.shift.shiftId}
            onSelect={() => onSelectShift?.(item.shift.shiftId)}
          />
        ))}

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-teal-600 z-10"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-teal-600" />
        </div>
      </div>
    </div>
  );
}

interface ShiftBarProps {
  shift: StaffingShift;
  lane: number;
  decision: ShiftDecision;
  isSelected: boolean;
  onSelect: () => void;
}

function ShiftBar({ shift, lane, decision, isSelected, onSelect }: ShiftBarProps) {
  const segments = computeBarSegments(shift.startHour, shift.endHour, shift.isOvernight);
  const colors = CATEGORY_COLORS[shift.category];
  const indicator = DECISION_INDICATOR[decision];

  return (
    <>
      {segments.map((segment, i) => {
        const leftPercent = (segment.start / HOURS_IN_DAY) * 100;
        const widthPercent = ((segment.end - segment.start) / HOURS_IN_DAY) * 100;

        return (
          <button
            key={`${shift.shiftId}-${i}`}
            onClick={onSelect}
            className={cn(
              "absolute flex items-center gap-1.5 rounded border px-2 text-[11px] font-medium transition-all cursor-pointer",
              colors.bg,
              colors.border,
              colors.text,
              isSelected && "ring-1 ring-foreground/20 shadow-sm",
            )}
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              top: `${lane * 32 + 4}px`,
              height: "26px",
            }}
          >
            <span className="truncate">{shift.name}</span>
            {indicator.icon && (
              <span className={cn("flex-shrink-0", indicator.color)}>
                {indicator.icon}
              </span>
            )}
            {!indicator.icon && decision !== "pending" && (
              <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", decisionDotColor(decision))} />
            )}
          </button>
        );
      })}
    </>
  );
}

function decisionDotColor(decision: ShiftDecision): string {
  const map: Record<ShiftDecision, string> = {
    pending: "bg-muted-foreground/30",
    accepted: "bg-emerald-500",
    declined: "bg-rose-500",
    manual: "bg-blue-500",
    "re-suggested": "bg-amber-500",
  };
  return map[decision];
}

interface BarSegment {
  start: number;
  end: number;
}

/**Compute bar segments, splitting overnight shifts into two segments.*/
function computeBarSegments(startHour: number, endHour: number, isOvernight: boolean): BarSegment[] {
  if (!isOvernight) {
    return [{ start: startHour, end: endHour }];
  }
  // Overnight: render as two segments (start->24, 0->end)
  return [
    { start: startHour, end: HOURS_IN_DAY },
    { start: 0, end: endHour },
  ];
}

interface LaneAssignment {
  shift: StaffingShift;
  lane: number;
}

/**Assign shifts to visual lanes to avoid overlap.*/
function assignLanes(shifts: StaffingShift[]): LaneAssignment[] {
  const sorted = [...shifts].sort((a, b) => a.startHour - b.startHour);
  const laneEnds: number[] = [];
  const assignments: LaneAssignment[] = [];

  for (const shift of sorted) {
    const effectiveEnd = shift.isOvernight ? shift.endHour + HOURS_IN_DAY : shift.endHour;
    let assignedLane = -1;

    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= shift.startHour) {
        assignedLane = i;
        laneEnds[i] = effectiveEnd;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = laneEnds.length;
      laneEnds.push(effectiveEnd);
    }

    assignments.push({ shift, lane: assignedLane });
  }

  return assignments;
}

function getCurrentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
