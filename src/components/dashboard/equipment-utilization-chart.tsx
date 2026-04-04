"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatHour } from "@/lib/utils/format";
import type { ForecastSeries } from "@/lib/types";

const EQUIPMENT_COLORS: Record<string, string> = {
  xray: "#f59e0b",       // amber-500
  ct: "#8b5cf6",         // violet-500
  ultrasound: "#06b6d4",  // cyan-500
  lab: "#10b981",         // emerald-500
};

const EQUIPMENT_LABELS: Record<string, string> = {
  xray: "X-Ray",
  ct: "CT Scanner",
  ultrasound: "Ultrasound",
  lab: "Lab Station",
};

const CAPACITY_PERCENT = 100;
const NOW_COLOR = "#0d9488";
const CAPACITY_COLOR = "#ef4444";

interface EquipmentUtilizationChartProps {
  equipmentUtilization: Record<string, ForecastSeries>;
}

/** Build merged chart data with one column per equipment type. */
function buildChartData(equipmentUtilization: Record<string, ForecastSeries>) {
  const equipmentIds = Object.keys(equipmentUtilization);
  if (equipmentIds.length === 0) return [];

  const firstSeries = equipmentUtilization[equipmentIds[0]];
  if (!firstSeries) return [];

  return firstSeries.data.map((point, i) => {
    const row: Record<string, number | string> = {
      name: formatHour(point.hour),
      hour: point.hour,
    };

    for (const id of equipmentIds) {
      const value = equipmentUtilization[id]?.data[i]?.p50 ?? 0;
      row[id] = Math.round(value * 1000) / 10;
    }

    return row;
  });
}

/** Custom tooltip showing per-equipment utilization. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EquipmentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {EQUIPMENT_LABELS[entry.dataKey] ?? entry.dataKey}
            </span>
            <span className="font-mono font-medium ml-auto">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Multi-line chart showing diagnostic equipment utilization over 24 hours.
 * One line per equipment type (X-Ray, CT, Ultrasound, Lab).
 */
export function EquipmentUtilizationChart({
  equipmentUtilization,
}: EquipmentUtilizationChartProps) {
  const chartData = buildChartData(equipmentUtilization);
  const equipmentIds = Object.keys(equipmentUtilization);
  const currentHour = new Date().getHours();

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Diagnostic Equipment Utilization
          </h3>
          <p className="text-xs text-muted-foreground">% capacity</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
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
              domain={[0, 120]}
              tickFormatter={(v: number) => `${v}%`}
            />

            <Tooltip content={<EquipmentTooltip />} />

            <Legend
              verticalAlign="top"
              height={28}
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />

            {/* Capacity line at 100% */}
            <ReferenceLine
              y={CAPACITY_PERCENT}
              stroke={CAPACITY_COLOR}
              strokeDasharray="6 3"
              strokeWidth={1}
              label={{
                value: "Capacity",
                position: "right",
                style: { fontSize: 9, fill: CAPACITY_COLOR },
              }}
            />

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

            {equipmentIds.map((id) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                name={EQUIPMENT_LABELS[id] ?? id}
                stroke={EQUIPMENT_COLORS[id] ?? "#6b7280"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
