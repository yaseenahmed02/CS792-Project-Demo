import type {
  ForecastResponse,
  ForecastPoint,
  ForecastSeries,
  RiskPosture,
  ScenarioState,
  HospitalConfig,
  CTASLevel,
  DiagnosticEquipment,
} from "@/lib/types";
import { CTAS_LEVELS } from "@/lib/constants/ctas";
import { DEFAULT_HOSPITAL_CONFIG } from "@/lib/constants/hospital-config";
import {
  generateCTASArrivals,
  applyScenarioModifiers,
  generateDepartures,
  generateAcuityDrift,
  generateArrivalModeSplit,
  addNoise,
} from "./temporal-patterns";

const HOURS_IN_DAY = 24;
const P10_FACTOR = 0.75;
const P90_FACTOR = 1.35;
const OR_PROBABILITY = 0.25;

// Realistic midnight starting occupancy by CTAS level
const INITIAL_OCCUPANCY: Record<number, number> = {
  1: 1,
  2: 3,
  3: 5,
  4: 3,
  5: 2,
};

/** Build a ForecastPoint with P10 < P50 < P90 guaranteed. */
function buildForecastPoint(
  hour: number,
  baseDate: Date,
  p50Value: number,
): ForecastPoint {
  const timestamp = new Date(baseDate);
  timestamp.setHours(hour, 0, 0, 0);

  const p10 = Math.max(0, Math.round(p50Value * P10_FACTOR * 10) / 10);
  const p50 = Math.max(0, Math.round(p50Value * 10) / 10);
  const p90 = Math.max(p50, Math.round(p50Value * P90_FACTOR * 10) / 10);

  return { hour, timestamp: timestamp.toISOString(), p10, p50, p90 };
}

/** Build a ForecastSeries from an array of 24 hourly P50 values. */
function buildSeries(
  label: string,
  unit: string,
  values: number[],
  baseDate: Date,
): ForecastSeries {
  const data = values.map((v, hour) => buildForecastPoint(hour, baseDate, v));
  return { label, unit, data };
}

/**
 * Simulate hourly occupancy per CTAS level over 24 hours.
 * Each hour: occupancy += arrivals + acuityDrift - departures.
 * Departures are recomputed each hour from current occupancy and LOS.
 */
function computeOccupancyByCTAS(
  arrivals: Record<number, number[]>,
  ctasLevels: CTASLevel[],
): Record<number, number[]> {
  const occupancy: Record<number, number[]> = {};
  const current: Record<number, number> = {};

  for (const ctas of ctasLevels) {
    occupancy[ctas.level] = [];
    current[ctas.level] = INITIAL_OCCUPANCY[ctas.level] ?? 0;
  }

  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    // Snapshot current occupancy for drift/departure calculations
    const snapshot: Record<number, number[]> = {};
    for (const ctas of ctasLevels) {
      snapshot[ctas.level] = [current[ctas.level]];
    }

    const drift = computeHourlyDrift(current);
    const departureRates = computeHourlyDepartures(current, ctasLevels);

    for (const ctas of ctasLevels) {
      const arr = arrivals[ctas.level][hour];
      const dep = departureRates[ctas.level];
      const driftVal = drift[ctas.level];
      current[ctas.level] = Math.max(0, current[ctas.level] + arr + driftVal - dep);
      occupancy[ctas.level].push(Math.round(current[ctas.level] * 10) / 10);
    }
  }

  return occupancy;
}

/** Compute single-hour acuity drift from current occupancy snapshot. */
function computeHourlyDrift(
  current: Record<number, number>,
): Record<number, number> {
  const esc3to2 = (current[3] ?? 0) * 0.03;
  const esc4to3 = (current[4] ?? 0) * 0.02;
  const deesc2to3 = (current[2] ?? 0) * 0.05;

  return {
    1: 0,
    2: esc3to2 - deesc2to3,
    3: -esc3to2 + deesc2to3 + esc4to3,
    4: -esc4to3,
    5: 0,
  };
}

/** Compute single-hour departures per CTAS from current occupancy. */
function computeHourlyDepartures(
  current: Record<number, number>,
  ctasLevels: CTASLevel[],
): Record<number, number> {
  const departures: Record<number, number> = {};
  for (const ctas of ctasLevels) {
    const hourlyRate = 1 / ctas.avgLengthOfStayHours;
    departures[ctas.level] = addNoise(current[ctas.level] * hourlyRate, 0.08);
  }
  return departures;
}

/** Sum occupancy across all CTAS levels for each hour. */
function computeTotalOccupancy(
  occupancyByCTAS: Record<number, number[]>,
): number[] {
  const total: number[] = [];
  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    let sum = 0;
    for (let level = 1; level <= 5; level++) {
      sum += occupancyByCTAS[level]?.[hour] ?? 0;
    }
    total.push(Math.round(sum * 10) / 10);
  }
  return total;
}

/**
 * OR utilization: fraction of operating rooms in use each hour.
 * CTAS-1/2 patients requiring OR, capped by available rooms.
 */
function computeORUtilization(
  occupancyByCTAS: Record<number, number[]>,
  operatingRooms: number,
): number[] {
  return Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
    const ctas1 = occupancyByCTAS[1]?.[hour] ?? 0;
    const ctas2 = occupancyByCTAS[2]?.[hour] ?? 0;
    const needsOR = (ctas1 + ctas2) * OR_PROBABILITY;
    return Math.min(1.0, Math.round((needsOR / operatingRooms) * 100) / 100);
  });
}

/**
 * Equipment utilization: (patients routed * avgUsageMinutes) / (count * 60).
 * Patients routed = sum of occupancy for CTAS levels that use this equipment.
 */
function computeEquipmentUtilization(
  occupancyByCTAS: Record<number, number[]>,
  equipment: DiagnosticEquipment[],
): Record<string, number[]> {
  const result: Record<string, number[]> = {};

  for (const equip of equipment) {
    result[equip.id] = Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
      let patientsRouted = 0;
      for (const level of equip.requiredForCTAS) {
        patientsRouted += occupancyByCTAS[level]?.[hour] ?? 0;
      }
      const utilization = (patientsRouted * equip.avgUsageMinutes) / (equip.count * 60);
      return Math.min(1.0, Math.round(utilization * 100) / 100);
    });
  }

  return result;
}

/**
 * Generate a complete 24-hour forecast with per-CTAS arrivals,
 * ED occupancy, OR utilization, and equipment utilization.
 * Applies scenario modifiers and produces P10/P50/P90 confidence bands.
 */
export function generateForecast(
  scenarios: ScenarioState,
  riskPosture: RiskPosture,
  config: HospitalConfig = DEFAULT_HOSPITAL_CONFIG,
): ForecastResponse {
  const baseArrivals = generateCTASArrivals();
  const arrivals = applyScenarioModifiers(baseArrivals, scenarios);
  const occupancyByCTAS = computeOccupancyByCTAS(arrivals, CTAS_LEVELS);
  const totalOccupancy = computeTotalOccupancy(occupancyByCTAS);
  const orUtil = computeORUtilization(occupancyByCTAS, config.operatingRooms);
  const equipUtil = computeEquipmentUtilization(occupancyByCTAS, config.diagnosticEquipment);

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const ctasArrivals: Record<number, ForecastSeries> = {};
  for (const ctas of CTAS_LEVELS) {
    ctasArrivals[ctas.level] = buildSeries(
      `CTAS-${ctas.level} ${ctas.name}`,
      "patients/hr",
      arrivals[ctas.level],
      baseDate,
    );
  }

  const equipmentUtilization: Record<string, ForecastSeries> = {};
  for (const equip of config.diagnosticEquipment) {
    equipmentUtilization[equip.id] = buildSeries(
      equip.name,
      "utilization",
      equipUtil[equip.id],
      baseDate,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    scenarios,
    riskPosture,
    ctasArrivals,
    edOccupancy: buildSeries("ED Occupancy", "patients", totalOccupancy, baseDate),
    orUtilization: buildSeries("OR Utilization", "utilization", orUtil, baseDate),
    equipmentUtilization,
  };
}
