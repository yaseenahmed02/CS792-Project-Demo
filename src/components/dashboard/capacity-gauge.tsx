"use client";

interface CapacityGaugeProps {
  value: number;
  max: number;
  label: string;
  size?: number;
}

const STROKE_WIDTH = 3;
const FULL_CIRCUMFERENCE = 283; // 2 * PI * 45 (radius)

/**Get gauge color based on utilization percentage.*/
function getGaugeColor(percentage: number): string {
  if (percentage < 60) return "text-teal-500";
  if (percentage < 80) return "text-amber-500";
  return "text-rose-500";
}

/**Radial donut gauge with colored fill based on utilization.*/
export function CapacityGauge({ value, max, label, size = 80 }: CapacityGaugeProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fillLength = (percentage / 100) * FULL_CIRCUMFERENCE;
  const dashOffset = FULL_CIRCUMFERENCE - fillLength;
  const colorClass = getGaugeColor(percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-muted/30"
          />
          {/* Fill arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={FULL_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={colorClass}
            style={{
              transition: "stroke-dashoffset 600ms ease-out",
            }}
          />
        </svg>
        {/* Center percentage overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            {percentage}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
