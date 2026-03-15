import type { ScenarioState } from "@/lib/types";

const HOURS_IN_DAY = 24;

/**
 * Generate a Gaussian random number using Box-Muller transform.
 * Returns a value centered at 0 with standard deviation 1.
 */
function gaussianNoise(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**Add Gaussian noise to a value with the given sigma fraction.*/
function addNoise(value: number, sigmaFraction: number): number {
  return Math.max(0, value + value * sigmaFraction * gaussianNoise());
}

/**
 * Generate 24-hour non-severe arrival pattern following a diurnal curve.
 * Trough at 3-5am (~2-3/hr), peak at 10am-2pm (~10-12/hr),
 * secondary bump at 6-8pm (~8/hr).
 */
export function generateBaseNonSevereArrivals(): number[] {
  const pattern = [
    3.0, 2.5, 2.2, 2.0, 2.2, 2.8, // 00-05: overnight trough
    4.0, 5.5, 7.5, 9.5, 11.0, 11.5, // 06-11: morning ramp
    10.5, 10.0, 9.0, 8.5, 8.0, 8.5, // 12-17: afternoon
    9.0, 8.0, 7.0, 5.5, 4.5, 3.5, // 18-23: evening decline
  ];

  return pattern.map((value) => addNoise(value, 0.08));
}

/**
 * Generate 24-hour high-acuity arrival pattern.
 * Flatter than non-severe, baseline ~1.5, peak ~2.5 mid-day.
 */
export function generateBaseHighAcuityArrivals(): number[] {
  const pattern = [
    1.2, 1.0, 0.9, 0.8, 0.9, 1.0, // 00-05
    1.3, 1.5, 1.8, 2.2, 2.5, 2.4, // 06-11
    2.3, 2.2, 2.0, 1.8, 1.7, 1.8, // 12-17
    1.9, 1.7, 1.5, 1.3, 1.2, 1.1, // 18-23
  ];

  return pattern.map((value) => addNoise(value, 0.08));
}

/**
 * Generate 24-hour departure pattern.
 * Roughly follows arrivals with a 3-4 hour lag.
 */
export function generateBaseDepartures(): number[] {
  const pattern = [
    4.0, 3.5, 3.0, 2.5, 2.5, 2.8, // 00-05
    3.5, 4.0, 5.0, 6.5, 8.0, 9.5, // 06-11
    10.0, 10.5, 9.5, 9.0, 8.5, 8.0, // 12-17
    7.5, 7.0, 6.0, 5.0, 4.5, 4.0, // 18-23
  ];

  return pattern.map((value) => addNoise(value, 0.08));
}

interface ModifiedPatterns {
  nonSevereArrivals: number[];
  highAcuityArrivals: number[];
  departures: number[];
}

/**
 * Apply scenario modifiers (influenza outbreak, major incident) to base patterns.
 * Influenza increases non-severe arrivals by ~40% and slightly increases acuity.
 * Major incident spikes high-acuity arrivals by ~80% and reduces departures.
 */
export function applyScenarioModifiers(
  nonSevere: number[],
  highAcuity: number[],
  departures: number[],
  scenarios: ScenarioState,
): ModifiedPatterns {
  let modifiedNonSevere = [...nonSevere];
  let modifiedHighAcuity = [...highAcuity];
  let modifiedDepartures = [...departures];

  if (scenarios.influenzaOutbreak) {
    modifiedNonSevere = modifiedNonSevere.map((v) => v * 1.4);
    modifiedHighAcuity = modifiedHighAcuity.map((v) => v * 1.15);
    // Flu patients have longer stays, reducing departure rate
    modifiedDepartures = modifiedDepartures.map((v) => v * 0.85);
  }

  if (scenarios.majorIncident) {
    // Major incident: high-acuity spikes ×2.5 for hours 0-4, then tapers
    modifiedHighAcuity = modifiedHighAcuity.map((v, hour) => {
      if (hour < 4) return v * 2.5;
      if (hour < 8) return v * 1.8;
      if (hour < 12) return v * 1.3;
      return v * 1.1;
    });
    modifiedNonSevere = modifiedNonSevere.map((v) => v * 1.1);
    // Trauma cases take longer to clear
    modifiedDepartures = modifiedDepartures.map((v) => v * 0.75);
  }

  return {
    nonSevereArrivals: modifiedNonSevere,
    highAcuityArrivals: modifiedHighAcuity,
    departures: modifiedDepartures,
  };
}
