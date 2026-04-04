"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CTAS_LEVELS, DEFAULT_SHIFTS } from "@/lib/constants";
import { formatHour } from "@/lib/utils/format";
import type { ForecastSeries } from "@/lib/types";

const SHIFT_BOUNDARY_COLOR = "#d4d4d8";
const NOW_COLOR = "#0d9488";

interface CTASArrivalsChartProps {
  ctasArrivals: Record<number, ForecastSeries>;
}

/** Build shift boundary hours for reference lines. */
function getShiftBoundaryHours(): number[] {
  const hours = new Set<number>();
  for (const shift of DEFAULT_SHIFTS) {
    if (shift.startHour > 0) hours.add(shift.startHour);
  }
  return Array.from(hours).sort((a, b) => a - b);
}

/** Merge all 5 CTAS levels into a flat array for Recharts stacked area. */
function buildStackedData(ctasArrivals: Record<number, ForecastSeries>) {
  const firstSeries = ctasArrivals[1];
  if (!firstSeries) return [];

  return firstSeries.data.map((point, i) => {
    const row: Record<string, number | string> = {
      name: formatHour(point.hour),
      hour: point.hour,
    };

    for (let level = 1; level <= 5; level++) {
      const value = ctasArrivals[level]?.data[i]?.p50 ?? 0;
      row[`ctas${level}`] = Math.round(value * 10) / 10;
    }

    return row;
  });
}

/** Custom tooltip showing per-CTAS breakdown. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CTASTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {CTAS_LEVELS.map((ctas) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entry = payload.find((p: any) => p.dataKey === `ctas${ctas.level}`);
          if (!entry) return null;

          return (
            <div key={ctas.level} className="flex items-center gap-2 text-xs">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ctas.color }}
              />
              <span className="text-muted-foreground">{ctas.name}</span>
              <span className="font-mono font-medium ml-auto">
                {entry.value.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Stacked area chart showing patient arrivals by CTAS acuity level.
 * 5 colored areas (CTAS 1-5) stacked over 24 hours.
 */
export function CTASArrivalsChart({ ctasArrivals }: CTASArrivalsChartProps) {
  const chartData = buildStackedData(ctasArrivals);
  const currentHour = new Date().getHours();
  const shiftBoundaries = getShiftBoundaryHours();

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Patient Arrivals by Acuity (CTAS)
          </h3>
          <p className="text-xs text-muted-foreground">patients/hr</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              {CTAS_LEVELS.map((ctas) => (
                <linearGradient
                  key={ctas.level}
                  id={`gradient-ctas-${ctas.level}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={ctas.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={ctas.color} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border"
              opacity={0.4}
            />

            <XAxis
              dataKey="name"
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

            <Tooltip content={<CTASTooltip />} />

            <Legend
              verticalAlign="top"
              height={28}
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />

            {/* Render in reverse order so CTAS 1 (most severe) is on top */}
            {[...CTAS_LEVELS].reverse().map((ctas) => (
              <Area
                key={ctas.level}
                type="monotone"
                dataKey={`ctas${ctas.level}`}
                name={`CTAS ${ctas.level}`}
                stackId="ctas"
                stroke={ctas.color}
                strokeWidth={1}
                fill={`url(#gradient-ctas-${ctas.level})`}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}

            {/* Shift boundary lines */}
            {shiftBoundaries.map((hour) => (
              <ReferenceLine
                key={`shift-${hour}`}
                x={formatHour(hour)}
                stroke={SHIFT_BOUNDARY_COLOR}
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
            ))}

            {/* Current hour marker */}
            <ReferenceLine
              x={formatHour(currentHour)}
              stroke={NOW_COLOR}
              strokeWidth={1}
              strokeDasharray="3 2"
              label={{
                value: "Now",
                position: "top",
                style: { fontSize: 9, fill: NOW_COLOR, fontWeight: 500 },
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
