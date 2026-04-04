"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  BedDouble,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Scissors,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CapacityGauge } from "./capacity-gauge";
import {
  OCCUPANCY_CAPACITY,
  WAIT_TIME_TARGET_MINUTES,
  DEFAULT_HOSPITAL_CONFIG,
  DEFAULT_EQUIPMENT,
} from "@/lib/constants";
import type { ForecastResponse } from "@/lib/types";

const SPARKLINE_HOURS = 6;
const WAIT_TIME_THRESHOLDS = { good: 20, warning: 35 };
const BED_THRESHOLDS = { good: 15, warning: 8 };

/** Derive a synthetic wait time from occupancy using a simple model. */
function deriveWaitTime(occupancyP50: number): number {
  const utilization = occupancyP50 / OCCUPANCY_CAPACITY;
  // Queuing-theory-inspired: wait grows nonlinearly as utilization approaches 1
  return Math.round(5 + 25 * Math.pow(utilization, 2.5));
}

/** Build SVG path for a mini sparkline from data points. */
function buildSparklinePath(values: number[]): string {
  if (values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const step = width / (values.length - 1);

  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Mini sparkline SVG for last N hours of data. */
function Sparkline({ values }: { values: number[] }) {
  const path = buildSparklinePath(values);
  const isUp = values.length >= 2 && values[values.length - 1] >= values[values.length - 2];

  return (
    <svg width={80} height={24} className="overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={isUp ? "#f59e0b" : "#0d9488"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
    </svg>
  );
}

/** Trend arrow with direction indicator. */
function TrendArrow({ current, previous }: { current: number; previous: number }) {
  const isUp = current >= previous;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? "text-amber-500" : "text-teal-500";

  return <Icon className={cn("h-3.5 w-3.5", color)} />;
}

/** Status dot indicating severity level. */
function StatusDot({ level }: { level: "good" | "warning" | "critical" }) {
  const colors = {
    good: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-rose-500",
  };

  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors[level]}`} />
  );
}

/** Determine status level for wait time. */
function getWaitTimeLevel(minutes: number): "good" | "warning" | "critical" {
  if (minutes < WAIT_TIME_THRESHOLDS.good) return "good";
  if (minutes < WAIT_TIME_THRESHOLDS.warning) return "warning";
  return "critical";
}

/** Determine status level for available beds. */
function getBedsLevel(available: number): "good" | "warning" | "critical" {
  if (available > BED_THRESHOLDS.good) return "good";
  if (available > BED_THRESHOLDS.warning) return "warning";
  return "critical";
}

/** Determine status level for utilization percentage. */
function getUtilizationLevel(percent: number): "good" | "warning" | "critical" {
  if (percent < 60) return "good";
  if (percent < 80) return "warning";
  return "critical";
}

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  index?: number;
}

/** Clean metric card with consistent styling and subtle entrance. */
function MetricCard({ title, icon, children, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="h-full border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-muted-foreground">{icon}</div>
            <span className="text-xs font-medium text-muted-foreground">
              {title}
            </span>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Sum P50 arrivals across all CTAS levels for a given hour. */
function sumArrivalsAtHour(
  ctasArrivals: Record<number, { data: { p50: number }[] }>,
  hour: number,
): number {
  let total = 0;
  for (let level = 1; level <= 5; level++) {
    total += ctasArrivals[level]?.data[hour]?.p50 ?? 0;
  }
  return total;
}

/** Find the equipment with the highest current utilization. */
function findPeakEquipment(
  equipmentUtilization: Record<string, { data: { p50: number }[] }>,
  hour: number,
): { name: string; percent: number } {
  let peakId = "";
  let peakValue = 0;

  for (const [id, series] of Object.entries(equipmentUtilization)) {
    const value = series.data[hour]?.p50 ?? 0;
    if (value > peakValue) {
      peakValue = value;
      peakId = id;
    }
  }

  const equipment = DEFAULT_EQUIPMENT.find((e) => e.id === peakId);
  const name = equipment?.name ?? peakId;
  return { name, percent: Math.round(peakValue * 100) };
}

/** Six metric cards showing the current ED snapshot derived from forecast data. */
export function CurrentEdStatus({ forecast }: { forecast: ForecastResponse }) {
  const currentHour = new Date().getHours();
  const occupancyData = forecast.edOccupancy.data;

  const currentOccupancy = Math.round(occupancyData[currentHour]?.p50 ?? occupancyData[0].p50);
  const availableBeds = Math.max(0, OCCUPANCY_CAPACITY - currentOccupancy);

  const currentArrivals = Math.round(sumArrivalsAtHour(forecast.ctasArrivals, currentHour));
  const prevHour = (currentHour - 1 + 24) % 24;
  const previousArrivals = Math.round(sumArrivalsAtHour(forecast.ctasArrivals, prevHour));

  const sparklineValues: number[] = [];
  for (let i = SPARKLINE_HOURS - 1; i >= 0; i--) {
    const h = (currentHour - i + 24) % 24;
    sparklineValues.push(sumArrivalsAtHour(forecast.ctasArrivals, h));
  }

  const waitTime = deriveWaitTime(currentOccupancy);

  const orUtil = forecast.orUtilization.data[currentHour]?.p50 ?? 0;
  const orPercent = Math.round(orUtil * 100);
  const totalORs = DEFAULT_HOSPITAL_CONFIG.operatingRooms;
  const activeORs = Math.round(orUtil * totalORs);

  const peakEquipment = findPeakEquipment(forecast.equipmentUtilization, currentHour);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard
        title="Current occupancy"
        icon={<Activity className="h-4 w-4" />}
        index={0}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-foreground">{currentOccupancy}</p>
            <p className="text-xs text-muted-foreground">
              of {OCCUPANCY_CAPACITY} beds
            </p>
          </div>
          <CapacityGauge
            value={currentOccupancy}
            max={OCCUPANCY_CAPACITY}
            label=""
            size={56}
          />
        </div>
      </MetricCard>

      <MetricCard
        title="Arrivals (last hour)"
        icon={<TrendingUp className="h-4 w-4" />}
        index={1}
      >
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-foreground">{currentArrivals}</p>
          <TrendArrow current={currentArrivals} previous={previousArrivals} />
        </div>
        <div className="mt-2">
          <Sparkline values={sparklineValues} />
        </div>
      </MetricCard>

      <MetricCard
        title="Avg wait time"
        icon={<Clock className="h-4 w-4" />}
        index={2}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <StatusDot level={getWaitTimeLevel(waitTime)} />
                {waitTime}
                <span className="text-sm font-normal text-muted-foreground">
                  min
                </span>
              </span>
            </p>
          </div>
          <CapacityGauge
            value={waitTime}
            max={WAIT_TIME_TARGET_MINUTES}
            label="target"
            size={56}
          />
        </div>
      </MetricCard>

      <MetricCard
        title="Available beds"
        icon={<BedDouble className="h-4 w-4" />}
        index={3}
      >
        <div>
          <p className="text-2xl font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <StatusDot level={getBedsLevel(availableBeds)} />
              {availableBeds}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {availableBeds <= BED_THRESHOLDS.warning
              ? "Capacity pressure - consider diversions"
              : "Within normal range"}
          </p>
        </div>
      </MetricCard>

      <MetricCard
        title="OR Status"
        icon={<Scissors className="h-4 w-4" />}
        index={4}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <StatusDot level={getUtilizationLevel(orPercent)} />
                {activeORs}/{totalORs}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">ORs in use</p>
          </div>
          <CapacityGauge
            value={orPercent}
            max={100}
            label=""
            size={56}
          />
        </div>
      </MetricCard>

      <MetricCard
        title="Equipment Bottleneck"
        icon={<Stethoscope className="h-4 w-4" />}
        index={5}
      >
        <div>
          <p className="text-2xl font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <StatusDot level={getUtilizationLevel(peakEquipment.percent)} />
              {peakEquipment.percent}%
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {peakEquipment.name}
          </p>
        </div>
      </MetricCard>
    </div>
  );
}
