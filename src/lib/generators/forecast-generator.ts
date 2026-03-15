import type {
  ForecastResponse,
  ForecastPoint,
  ForecastSeries,
  RiskPosture,
  ScenarioState,
} from "@/lib/types";
import {
  generateBaseNonSevereArrivals,
  generateBaseHighAcuityArrivals,
  generateBaseDepartures,
  applyScenarioModifiers,
} from "./temporal-patterns";

const HOURS_IN_DAY = 24;
const P10_FACTOR = 0.75;
const P90_FACTOR = 1.35;
const INITIAL_OCCUPANCY = 35;

/**Build a ForecastPoint with P10 < P50 < P90 guaranteed.*/
function buildForecastPoint(hour: number, baseDate: Date, p50Value: number): ForecastPoint {
  const timestamp = new Date(baseDate);
  timestamp.setHours(hour, 0, 0, 0);

  const p10 = Math.max(0, Math.round(p50Value * P10_FACTOR * 10) / 10);
  const p50 = Math.max(0, Math.round(p50Value * 10) / 10);
  const p90 = Math.max(p50, Math.round(p50Value * P90_FACTOR * 10) / 10);

  return { hour, timestamp: timestamp.toISOString(), p10, p50, p90 };
}

/**Build a ForecastSeries from an array of 24 hourly P50 values.*/
function buildSeries(label: string, unit: string, values: number[], baseDate: Date): ForecastSeries {
  const data = values.map((value, hour) => buildForecastPoint(hour, baseDate, value));
  return { label, unit, data };
}

/**
 * Compute hourly occupancy using cumulative arrivals minus departures.
 * O_h = O_{h-1} + A_h - D_h, starting from INITIAL_OCCUPANCY.
 */
function computeOccupancy(
  nonSevere: number[],
  highAcuity: number[],
  departures: number[],
): number[] {
  const occupancy: number[] = [];
  let current = INITIAL_OCCUPANCY;

  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    const totalArrivals = nonSevere[hour] + highAcuity[hour];
    current = Math.max(0, current + totalArrivals - departures[hour]);
    occupancy.push(Math.round(current * 10) / 10);
  }

  return occupancy;
}

/**
 * Generate a complete 24-hour forecast with arrival, acuity, and occupancy series.
 * Applies scenario modifiers and produces P10/P50/P90 confidence bands.
 */
export function generateForecast(
  scenarios: ScenarioState,
  riskPosture: RiskPosture,
): ForecastResponse {
  const baseNonSevere = generateBaseNonSevereArrivals();
  const baseHighAcuity = generateBaseHighAcuityArrivals();
  const baseDepartures = generateBaseDepartures();

  const modified = applyScenarioModifiers(
    baseNonSevere,
    baseHighAcuity,
    baseDepartures,
    scenarios,
  );

  const occupancy = computeOccupancy(
    modified.nonSevereArrivals,
    modified.highAcuityArrivals,
    modified.departures,
  );

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  return {
    generatedAt: new Date().toISOString(),
    scenarios,
    riskPosture,
    nonSevereArrivals: buildSeries(
      "Non-Severe Arrivals",
      "patients/hr",
      modified.nonSevereArrivals,
      baseDate,
    ),
    highAcuityArrivals: buildSeries(
      "High-Acuity Arrivals",
      "patients/hr",
      modified.highAcuityArrivals,
      baseDate,
    ),
    edOccupancy: buildSeries(
      "ED Occupancy",
      "patients",
      occupancy,
      baseDate,
    ),
  };
}
