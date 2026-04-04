"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CTAS_LEVELS } from "@/lib/constants";
import { OCCUPANCY_CAPACITY } from "@/lib/constants";
import { formatHour } from "@/lib/utils/format";
import type { ForecastSeries } from "@/lib/types";

const NOW_COLOR = "#0d9488";
const CAPACITY_COLOR = "#ef4444";

interface AcuityOccupancyChartProps {
  ctasOccupancy: Record<number, ForecastSeries>;
}

/** Build stacked data from per-CTAS occupancy series. */
function buildStackedData(ctasOccupancy: Record<number, ForecastSeries>) {
  const firstSeries = ctasOccupancy[1];
  if (!firstSeries) return [];

  return firstSeries.data.map((point, i) => {
    const row: Record<string, number | string> = {
      name: formatHour(point.hour),
      hour: point.hour,
    };

    for (let level = 1; level <= 5; level++) {
      const value = ctasOccupancy[level]?.data[i]?.p50 ?? 0;
      row[`ctas${level}`] = Math.round(value * 10) / 10;
    }

    return row;
  });
}

/** Custom tooltip showing per-CTAS occupancy breakdown. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OccupancyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  let total = 0;

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {CTAS_LEVELS.map((ctas) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entry = payload.find((p: any) => p.dataKey === `ctas${ctas.level}`);
          if (!entry) return null;
          total += entry.value;

          return (
            <div key={ctas.level} className="flex items-center gap-2 text-xs">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ctas.color }}
              />
              <span className="text-muted-foreground">CTAS {ctas.level}</span>
              <span className="font-mono font-medium ml-auto">
                {entry.value.toFixed(0)}
              </span>
            </div>
          );
        })}
        <div className="border-t pt-1 flex items-center gap-2 text-xs font-medium">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono ml-auto">{Math.round(total)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Stacked area chart showing current ED occupancy broken down by CTAS level.
 * Shows who's in the ED right now and their acuity mix.
 */
export function AcuityOccupancyChart({ ctasOccupancy }: AcuityOccupancyChartProps) {
  const chartData = buildStackedData(ctasOccupancy);
  const currentHour = new Date().getHours();

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Current Patient Acuity
          </h3>
          <p className="text-xs text-muted-foreground">patients in ED by CTAS level</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              {CTAS_LEVELS.map((ctas) => (
                <linearGradient
                  key={ctas.level}
                  id={`gradient-occ-ctas-${ctas.level}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={ctas.color} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={ctas.color} stopOpacity={0.2} />
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

            <Tooltip content={<OccupancyTooltip />} />

            <Legend
              verticalAlign="top"
              height={28}
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />

            {/* Capacity line */}
            <ReferenceLine
              y={OCCUPANCY_CAPACITY}
              stroke={CAPACITY_COLOR}
              strokeDasharray="6 3"
              strokeWidth={1}
              label={{
                value: "Capacity",
                position: "right",
                style: { fontSize: 9, fill: CAPACITY_COLOR },
              }}
            />

            {/* Stack CTAS 5 at bottom, CTAS 1 on top */}
            {[...CTAS_LEVELS].reverse().map((ctas) => (
              <Area
                key={ctas.level}
                type="monotone"
                dataKey={`ctas${ctas.level}`}
                name={`CTAS ${ctas.level}`}
                stackId="occupancy"
                stroke={ctas.color}
                strokeWidth={1}
                fill={`url(#gradient-occ-ctas-${ctas.level})`}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
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
