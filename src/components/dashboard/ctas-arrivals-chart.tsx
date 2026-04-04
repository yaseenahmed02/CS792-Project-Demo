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
import { DEFAULT_SHIFTS } from "@/lib/constants";
import { formatHour } from "@/lib/utils/format";
import type { ForecastSeries } from "@/lib/types";

const SHIFT_BOUNDARY_COLOR = "#d4d4d8";
const NOW_COLOR = "#0d9488";

const STREAM_COLORS = {
  highAcuity: "#ef4444",   // red-500
  nonSevere: "#3b82f6",    // blue-500
};

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

/** Aggregate 5 CTAS streams into 2: High-Acuity (1-2) and Non-Severe (3-5). */
function buildStackedData(ctasArrivals: Record<number, ForecastSeries>) {
  const firstSeries = ctasArrivals[1];
  if (!firstSeries) return [];

  return firstSeries.data.map((point, i) => {
    const highAcuity =
      (ctasArrivals[1]?.data[i]?.p50 ?? 0) +
      (ctasArrivals[2]?.data[i]?.p50 ?? 0);
    const nonSevere =
      (ctasArrivals[3]?.data[i]?.p50 ?? 0) +
      (ctasArrivals[4]?.data[i]?.p50 ?? 0) +
      (ctasArrivals[5]?.data[i]?.p50 ?? 0);

    return {
      name: formatHour(point.hour),
      hour: point.hour,
      highAcuity: Math.round(highAcuity * 10) / 10,
      nonSevere: Math.round(nonSevere * 10) / 10,
    };
  });
}

/** Custom tooltip showing high-acuity vs non-severe breakdown. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CTASTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const streams = [
    { key: "highAcuity", label: "High-acuity arrivals", color: STREAM_COLORS.highAcuity },
    { key: "nonSevere", label: "Non-severe arrivals", color: STREAM_COLORS.nonSevere },
  ];

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {streams.map((stream) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entry = payload.find((p: any) => p.dataKey === stream.key);
          if (!entry) return null;

          return (
            <div key={stream.key} className="flex items-center gap-2 text-xs">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: stream.color }}
              />
              <span className="text-muted-foreground">{stream.label}</span>
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
            Patient Arrivals Forecast
          </h3>
          <p className="text-xs text-muted-foreground">patients/hr</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gradient-highAcuity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STREAM_COLORS.highAcuity} stopOpacity={0.6} />
                <stop offset="100%" stopColor={STREAM_COLORS.highAcuity} stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="gradient-nonSevere" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STREAM_COLORS.nonSevere} stopOpacity={0.6} />
                <stop offset="100%" stopColor={STREAM_COLORS.nonSevere} stopOpacity={0.15} />
              </linearGradient>
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

            <Area
              type="monotone"
              dataKey="nonSevere"
              name="Non-severe arrivals"
              stackId="arrivals"
              stroke={STREAM_COLORS.nonSevere}
              strokeWidth={1}
              fill="url(#gradient-nonSevere)"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="highAcuity"
              name="High-acuity arrivals"
              stackId="arrivals"
              stroke={STREAM_COLORS.highAcuity}
              strokeWidth={1}
              fill="url(#gradient-highAcuity)"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

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
