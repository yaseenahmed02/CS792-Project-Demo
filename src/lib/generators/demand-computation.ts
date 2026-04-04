import type {
  ForecastResponse,
  RiskPosture,
  HourlyRoleDemand,
  HospitalConfig,
  RoleName,
} from "@/lib/types";
import { ROLES, type RoleConfig } from "@/lib/constants/roles";
import { CTAS_LEVELS } from "@/lib/constants/ctas";

const ONGOING_CARE_FACTOR = 0.15;
const HOURS_IN_DAY = 24;

/**Compute raw workload for a single role at a single hour.*/
function computeRoleWorkload(
  role: RoleConfig,
  ctasArrivalsAtHour: Record<number, number>,
  occupancyAtHour: number,
): number {
  let workload = 0;
  for (const level of role.requiredForCTAS) {
    const arrivals = ctasArrivalsAtHour[level] ?? 0;
    const multiplier = CTAS_LEVELS.find((c) => c.level === level)?.staffMultiplier ?? 1;
    workload += arrivals * multiplier;
  }
  workload += occupancyAtHour * ONGOING_CARE_FACTOR;
  return workload;
}

/**Convert workload to required headcount using service rate and minimum.*/
function workloadToHeadcount(workload: number, serviceRate: number, minStaff: number): number {
  return Math.max(minStaff, Math.ceil(workload / serviceRate));
}

/**Extract CTAS arrival values at a specific hour for a given percentile.*/
export function extractCtasAtHour(
  forecast: ForecastResponse,
  hour: number,
  percentile: "p10" | "p50" | "p90",
): Record<number, number> {
  const result: Record<number, number> = {};
  for (let level = 1; level <= 5; level++) {
    const series = forecast.ctasArrivals[level];
    result[level] = series ? series.data[hour][percentile] : 0;
  }
  return result;
}

/**Build the roles demand record for a single hour.*/
export function buildRoleDemandForHour(
  ctasAtHour: Record<number, number>,
  occupancy: number,
): Record<RoleName, number> {
  const roles = {} as Record<RoleName, number>;
  for (const role of ROLES) {
    const workload = computeRoleWorkload(role, ctasAtHour, occupancy);
    roles[role.name] = workloadToHeadcount(workload, role.serviceRate, role.minStaff);
  }
  return roles;
}

/**
 * Compute hourly role demand from forecast P50 values.
 * For each hour and role, derives headcount from CTAS arrivals + occupancy.
 */
export function computeHourlyRoleDemand(
  forecast: ForecastResponse,
  _config?: HospitalConfig,
): HourlyRoleDemand[] {
  const demand: HourlyRoleDemand[] = [];

  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    const ctasAtHour = extractCtasAtHour(forecast, hour, "p50");
    const occupancy = forecast.edOccupancy.data[hour].p50;
    const roles = buildRoleDemandForHour(ctasAtHour, occupancy);
    demand.push({ hour, roles });
  }

  return demand;
}

/**Interpolate between P50 and P90 CTAS values by a factor (0=P50, 1=P90).*/
function interpolateCtasValues(
  p50: Record<number, number>,
  p90: Record<number, number>,
  factor: number,
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const level of Object.keys(p50)) {
    const key = Number(level);
    result[key] = p50[key] + factor * (p90[key] - p50[key]);
  }
  return result;
}

/**
 * Adjust hourly demand based on risk posture.
 * Normal: P50 (no change). Elevated: midpoint of P50 and P90. Critical: P90.
 */
export function adjustForRiskPosture(
  demand: HourlyRoleDemand[],
  forecast: ForecastResponse,
  riskPosture: RiskPosture,
): HourlyRoleDemand[] {
  if (riskPosture === "normal") return demand;

  return demand.map((hourDemand) => {
    const hour = hourDemand.hour;
    const ctasP50 = extractCtasAtHour(forecast, hour, "p50");
    const ctasP90 = extractCtasAtHour(forecast, hour, "p90");
    const occP50 = forecast.edOccupancy.data[hour].p50;
    const occP90 = forecast.edOccupancy.data[hour].p90;

    const factor = riskPosture === "critical" ? 1.0 : 0.5;
    const ctasAdjusted = interpolateCtasValues(ctasP50, ctasP90, factor);
    const occAdjusted = occP50 + factor * (occP90 - occP50);

    return {
      hour,
      roles: buildRoleDemandForHour(ctasAdjusted, occAdjusted),
    };
  });
}
