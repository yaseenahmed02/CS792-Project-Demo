import type { ForecastSeries, ForecastPoint } from "@/lib/types";

/**
 * Aggregate multiple CTAS arrival series into a single ForecastSeries.
 * Sums P10/P50/P90 values across the specified CTAS levels per hour.
 */
export function aggregateCTASSeries(
  ctasArrivals: Record<number, ForecastSeries>,
  levels: number[],
  label: string,
): ForecastSeries {
  const firstSeries = ctasArrivals[levels[0]];
  if (!firstSeries) {
    return { label, unit: "patients/hr", data: [] };
  }

  const data: ForecastPoint[] = firstSeries.data.map((point, i) => {
    let p10 = 0;
    let p50 = 0;
    let p90 = 0;

    for (const level of levels) {
      const d = ctasArrivals[level]?.data[i];
      if (d) {
        p10 += d.p10;
        p50 += d.p50;
        p90 += d.p90;
      }
    }

    return {
      hour: point.hour,
      timestamp: point.timestamp,
      p10: Math.round(p10 * 10) / 10,
      p50: Math.round(p50 * 10) / 10,
      p90: Math.round(p90 * 10) / 10,
    };
  });

  return { label, unit: "patients/hr", data };
}
