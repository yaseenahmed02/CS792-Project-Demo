"use client";

import { motion } from "framer-motion";
import { useForecast } from "@/hooks/use-forecast";
import {
  ScenarioToggles,
  RiskSelector,
  CurrentEdStatus,
  ForecastChart,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { OCCUPANCY_CAPACITY } from "@/lib/constants";

/**Skeleton placeholder for the controls row while loading.*/
function ControlsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-[140px] rounded-lg" />
      <Skeleton className="h-[140px] rounded-lg" />
    </div>
  );
}

/**Skeleton placeholder for the 4 metric cards while loading.*/
function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-lg" />
      ))}
    </div>
  );
}

/**Skeleton placeholder for a forecast chart while loading.*/
function ChartSkeleton() {
  return <Skeleton className="h-[320px] rounded-lg" />;
}

/**Error banner with retry action.*/
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
      <p className="text-sm text-destructive font-medium mb-2">
        Failed to load forecast data
      </p>
      <p className="text-xs text-muted-foreground mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm font-medium text-destructive underline underline-offset-4 hover:opacity-80"
      >
        Try again
      </button>
    </div>
  );
}

/**Dashboard page assembling scenario controls, metrics, and forecast charts.*/
export default function DashboardPage() {
  const { forecast, isLoading, error, refetch } = useForecast();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScenarioToggles />
          <RiskSelector />
        </div>
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !forecast) {
    return (
      <div className="space-y-6">
        <ControlsSkeleton />
        <MetricsSkeleton />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Page description */}
      <p className="text-sm text-muted-foreground">
        24-hour forecast with confidence intervals
      </p>

      {/* Top row: Scenario controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScenarioToggles />
        <RiskSelector />
      </div>

      {/* Second row: Current ED status metrics */}
      <CurrentEdStatus forecast={forecast} />

      {/* Main area: Forecast charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <ForecastChart
          series={forecast.nonSevereArrivals}
          title="Non-severe arrivals"
          unit="patients/hr"
        />
        <ForecastChart
          series={forecast.highAcuityArrivals}
          title="High-acuity arrivals"
          unit="patients/hr"
        />
        <ForecastChart
          series={forecast.edOccupancy}
          title="ED occupancy"
          unit="patients"
          showCapacityLine
          capacityValue={OCCUPANCY_CAPACITY}
        />
      </div>
    </motion.div>
  );
}
