"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { HourlyRoleDemand, RoleName, StaffingShift } from "@/lib/types";
import { formatHour } from "@/lib/utils/format";

const COLORS = {
  demand: "#f59e0b",
  demandFill: "rgba(245, 158, 11, 0.12)",
  coverage: "#0d9488",
  coverageFill: "rgba(13, 148, 136, 0.12)",
  gap: "rgba(244, 63, 94, 0.08)",
  shiftCore: "rgba(59, 130, 246, 0.06)",
  shiftSwing: "rgba(245, 158, 11, 0.06)",
  shiftFlex: "rgba(168, 85, 247, 0.06)",
};

const SHIFT_BG_COLOR: Record<string, string> = {
  core: COLORS.shiftCore,
  swing: COLORS.shiftSwing,
  flex: COLORS.shiftFlex,
};

interface DemandCoverageChartProps {
  hourlyDemand: HourlyRoleDemand[];
  hourlyCoverage: HourlyRoleDemand[];
  shifts: StaffingShift[];
}

/**
 * Recharts chart showing hourly demand vs shift coverage.
 * Highlights gaps where demand exceeds coverage.
 */
export function DemandCoverageChart({
  hourlyDemand,
  hourlyCoverage,
  shifts,
}: DemandCoverageChartProps) {
  const roleNames = useMemo(() => extractRoleNames(hourlyDemand), [hourlyDemand]);
  const [selectedRole, setSelectedRole] = useState<RoleName | "total">("total");

  const chartData = useMemo(
    () => buildChartData(hourlyDemand, hourlyCoverage, selectedRole),
    [hourlyDemand, hourlyCoverage, selectedRole],
  );

  const gapRanges = useMemo(() => findGapRanges(chartData), [chartData]);

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Demand vs Coverage
            </h3>
            <p className="text-xs text-muted-foreground">
              Hourly staffing need vs shift coverage
            </p>
          </div>
          <RoleSelector
            roles={roleNames}
            selected={selectedRole}
            onSelect={setSelectedRole}
          />
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gradient-demand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.demand} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.demand} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradient-coverage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.coverage} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.coverage} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border"
              opacity={0.4}
            />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />

            <Tooltip content={<CoverageTooltip />} />

            {/* Shift coverage background bands */}
            {shifts
              .filter((s) => !s.isOvernight)
              .map((shift) => (
                <ReferenceArea
                  key={shift.shiftId}
                  x1={formatHour(shift.startHour)}
                  x2={formatHour(shift.endHour)}
                  fill={SHIFT_BG_COLOR[shift.category] ?? COLORS.shiftCore}
                  fillOpacity={1}
                />
              ))}

            {/* Gap highlighting */}
            {gapRanges.map((range, i) => (
              <ReferenceArea
                key={`gap-${i}`}
                x1={range.start}
                x2={range.end}
                fill={COLORS.gap}
                fillOpacity={1}
              />
            ))}

            {/* Demand line */}
            <Area
              type="monotone"
              dataKey="demand"
              stroke={COLORS.demand}
              strokeWidth={2}
              fill="url(#gradient-demand)"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* Coverage line */}
            <Area
              type="monotone"
              dataKey="coverage"
              stroke={COLORS.coverage}
              strokeWidth={2}
              strokeDasharray="4 3"
              fill="url(#gradient-coverage)"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-2 flex items-center gap-4">
          <LegendItem color={COLORS.demand} label="Demand" />
          <LegendItem color={COLORS.coverage} label="Coverage" dashed />
          <LegendItem color="rgba(244, 63, 94, 0.3)" label="Gap" filled />
        </div>
      </CardContent>
    </Card>
  );
}

function RoleSelector({
  roles,
  selected,
  onSelect,
}: {
  roles: RoleName[];
  selected: RoleName | "total";
  onSelect: (role: RoleName | "total") => void;
}) {
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value as RoleName | "total")}
      className="h-7 rounded-md border bg-background px-2 text-xs"
    >
      <option value="total">All roles (total)</option>
      {roles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}

function LegendItem({
  color,
  label,
  dashed,
  filled,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  filled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {filled ? (
        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      ) : (
        <div
          className="h-0 w-4"
          style={{
            borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}`,
          }}
        />
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CoverageTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const demand = payload.find((p: any) => p.dataKey === "demand");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coverage = payload.find((p: any) => p.dataKey === "coverage");
  const gap = demand && coverage ? demand.value - coverage.value : 0;

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {demand && (
          <TooltipRow color={COLORS.demand} label="Demand" value={demand.value} />
        )}
        {coverage && (
          <TooltipRow color={COLORS.coverage} label="Coverage" value={coverage.value} />
        )}
        {gap > 0 && (
          <TooltipRow color="#f43f5e" label="Gap" value={gap} />
        )}
      </div>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium ml-auto">{value.toFixed(1)}</span>
    </div>
  );
}

interface ChartPoint {
  label: string;
  hour: number;
  demand: number;
  coverage: number;
}

function buildChartData(
  hourlyDemand: HourlyRoleDemand[],
  hourlyCoverage: HourlyRoleDemand[],
  selectedRole: RoleName | "total",
): ChartPoint[] {
  return hourlyDemand.map((demandPoint, i) => {
    const coveragePoint = hourlyCoverage[i];

    const demand =
      selectedRole === "total"
        ? sumAllRoles(demandPoint.roles)
        : (demandPoint.roles[selectedRole] ?? 0);

    const coverage =
      selectedRole === "total"
        ? sumAllRoles(coveragePoint?.roles ?? {})
        : (coveragePoint?.roles[selectedRole] ?? 0);

    return {
      label: formatHour(demandPoint.hour),
      hour: demandPoint.hour,
      demand,
      coverage,
    };
  });
}

function sumAllRoles(roles: Record<string, number>): number {
  return Object.values(roles).reduce((sum, v) => sum + v, 0);
}

function extractRoleNames(hourlyDemand: HourlyRoleDemand[]): RoleName[] {
  if (hourlyDemand.length === 0) return [];
  return Object.keys(hourlyDemand[0].roles) as RoleName[];
}

interface GapRange {
  start: string;
  end: string;
}

function findGapRanges(data: ChartPoint[]): GapRange[] {
  const ranges: GapRange[] = [];
  let gapStart: string | null = null;

  for (const point of data) {
    if (point.demand > point.coverage) {
      if (!gapStart) {
        gapStart = point.label;
      }
    } else if (gapStart) {
      ranges.push({ start: gapStart, end: point.label });
      gapStart = null;
    }
  }

  // Close trailing gap
  if (gapStart && data.length > 0) {
    ranges.push({ start: gapStart, end: data[data.length - 1].label });
  }

  return ranges;
}
