import type { ScenarioState, CTASLevel } from "@/lib/types";

const HOURS_IN_DAY = 24;
const NOISE_SIGMA = 0.08;

// Fraction of total arrivals assigned to each CTAS level
const CTAS_ARRIVAL_FRACTIONS: Record<number, number> = {
  1: 0.01,
  2: 0.10,
  3: 0.30,
  4: 0.35,
  5: 0.24,
};

// Ambulance fraction by CTAS level
const AMBULANCE_FRACTIONS: Record<number, number> = {
  1: 0.80,
  2: 0.50,
  3: 0.20,
  4: 0.05,
  5: 0.05,
};

/**
 * Generate a Gaussian random number using Box-Muller transform.
 * Returns a value centered at 0 with standard deviation 1.
 */
function gaussianNoise(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Add Gaussian noise to a value with the given sigma fraction. */
export function addNoise(value: number, sigmaFraction: number): number {
  return Math.max(0, value + value * sigmaFraction * gaussianNoise());
}

/**
 * Total ED arrival rate per hour (all CTAS combined).
 * Peak ~11/hr at 10am-1pm, trough ~3/hr at 3-5am.
 */
function buildTotalArrivalCurve(): number[] {
  return [
    3.0, 2.5, 2.2, 2.0, 2.2, 2.8,   // 00-05: overnight trough
    4.5, 6.0, 8.0, 10.0, 11.0, 11.5, // 06-11: morning ramp
    11.0, 10.0, 9.0, 8.5, 8.0, 8.5,  // 12-17: afternoon
    9.0, 8.0, 7.0, 5.5, 4.5, 3.5,    // 18-23: evening decline
  ];
}

/**
 * Diurnal shape weights by CTAS level (0-1 per hour, normalized).
 * CTAS-1 is flat (emergencies anytime), CTAS-4/5 peak mid-day.
 */
function buildDiurnalWeight(ctasLevel: number): number[] {
  const shapes: Record<number, number[]> = {
    1: Array(HOURS_IN_DAY).fill(1.0),
    2: [
      0.7, 0.6, 0.6, 0.5, 0.6, 0.7,
      0.8, 0.9, 1.0, 1.0, 1.0, 1.0,
      1.0, 0.9, 0.9, 0.8, 0.8, 0.8,
      0.9, 0.8, 0.7, 0.7, 0.7, 0.7,
    ],
    3: [
      0.4, 0.3, 0.3, 0.2, 0.3, 0.4,
      0.6, 0.8, 0.9, 1.0, 1.0, 1.0,
      0.9, 0.9, 0.8, 0.8, 0.7, 0.8,
      0.8, 0.7, 0.6, 0.5, 0.4, 0.4,
    ],
    4: [
      0.3, 0.2, 0.2, 0.1, 0.2, 0.3,
      0.5, 0.7, 0.9, 1.0, 1.0, 1.0,
      1.0, 0.9, 0.9, 0.8, 0.8, 0.9,
      0.9, 0.8, 0.6, 0.4, 0.3, 0.3,
    ],
    5: [
      0.2, 0.1, 0.1, 0.1, 0.1, 0.2,
      0.4, 0.6, 0.8, 1.0, 1.0, 1.0,
      1.0, 0.9, 0.8, 0.8, 0.7, 0.8,
      0.8, 0.6, 0.4, 0.3, 0.2, 0.2,
    ],
  };
  return shapes[ctasLevel];
}

/**
 * Generate 24-hour arrival arrays for all 5 CTAS levels.
 * Each level gets its fraction of total arrivals, shaped by a
 * level-specific diurnal curve. Includes 8% Gaussian noise.
 */
export function generateCTASArrivals(): Record<number, number[]> {
  const totalCurve = buildTotalArrivalCurve();
  const result: Record<number, number[]> = {};

  for (let level = 1; level <= 5; level++) {
    const fraction = CTAS_ARRIVAL_FRACTIONS[level];
    const diurnal = buildDiurnalWeight(level);
    const meanWeight = diurnal.reduce((a, b) => a + b, 0) / HOURS_IN_DAY;

    result[level] = totalCurve.map((total, hour) => {
      const shaped = total * fraction * (diurnal[hour] / meanWeight);
      return addNoise(shaped, NOISE_SIGMA);
    });
  }

  return result;
}

/** Influenza scenario modifiers by CTAS level. */
const INFLUENZA_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.10,
  3: 1.30,
  4: 1.50,
  5: 1.20,
};

/** Major incident modifiers by CTAS level (first 4 hours only). */
const INCIDENT_MULTIPLIERS: Record<number, number> = {
  1: 3.0,
  2: 2.5,
  3: 1.30,
  4: 1.0,
  5: 1.0,
};

/**
 * Apply scenario modifiers to per-CTAS arrival arrays.
 * Influenza: across all hours. Major incident: first 4 hours only.
 */
export function applyScenarioModifiers(
  arrivals: Record<number, number[]>,
  scenarios: ScenarioState,
): Record<number, number[]> {
  const modified: Record<number, number[]> = {};

  for (let level = 1; level <= 5; level++) {
    modified[level] = [...arrivals[level]];
  }

  if (scenarios.influenzaOutbreak) {
    for (let level = 1; level <= 5; level++) {
      const mult = INFLUENZA_MULTIPLIERS[level];
      modified[level] = modified[level].map((v) => v * mult);
    }
  }

  if (scenarios.majorIncident) {
    for (let level = 1; level <= 5; level++) {
      const mult = INCIDENT_MULTIPLIERS[level];
      modified[level] = modified[level].map((v, hour) =>
        hour < 4 ? v * mult : v,
      );
    }
  }

  return modified;
}

/**
 * Compute hourly departures per CTAS level based on current occupancy
 * and average length of stay. Departure rate = occupancy / LOS.
 */
export function generateDepartures(
  occupancyByCTAS: Record<number, number[]>,
  ctasLevels: CTASLevel[],
): Record<number, number[]> {
  const departures: Record<number, number[]> = {};

  for (const ctas of ctasLevels) {
    const hourlyRate = 1 / ctas.avgLengthOfStayHours;
    departures[ctas.level] = occupancyByCTAS[ctas.level].map((occ) =>
      addNoise(occ * hourlyRate, NOISE_SIGMA),
    );
  }

  return departures;
}

/**
 * Simulate small hourly acuity drift between CTAS levels.
 * Returns net patient change per level per hour (can be negative).
 *
 * Drift rates: 3% CTAS-3 -> CTAS-2, 2% CTAS-4 -> CTAS-3,
 * 5% CTAS-2 -> CTAS-3 (de-escalation).
 */
export function generateAcuityDrift(
  occupancyByCTAS: Record<number, number[]>,
): Record<number, number[]> {
  const drift: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    const esc3to2 = (occupancyByCTAS[3]?.[hour] ?? 0) * 0.03;
    const esc4to3 = (occupancyByCTAS[4]?.[hour] ?? 0) * 0.02;
    const deesc2to3 = (occupancyByCTAS[2]?.[hour] ?? 0) * 0.05;

    drift[1][hour] = 0;
    drift[2][hour] = esc3to2 - deesc2to3;
    drift[3][hour] = -esc3to2 + deesc2to3 + esc4to3;
    drift[4][hour] = -esc4to3;
    drift[5][hour] = 0;
  }

  return drift;
}

interface ArrivalModeSplit {
  walkIn: Record<number, number[]>;
  ambulance: Record<number, number[]>;
}

/**
 * Split CTAS arrivals into walk-in and ambulance based on acuity.
 * Higher acuity = more ambulance arrivals.
 */
export function generateArrivalModeSplit(
  ctasArrivals: Record<number, number[]>,
): ArrivalModeSplit {
  const walkIn: Record<number, number[]> = {};
  const ambulance: Record<number, number[]> = {};

  for (let level = 1; level <= 5; level++) {
    const ambFrac = AMBULANCE_FRACTIONS[level];
    ambulance[level] = ctasArrivals[level].map((v) => v * ambFrac);
    walkIn[level] = ctasArrivals[level].map((v) => v * (1 - ambFrac));
  }

  return { walkIn, ambulance };
}
