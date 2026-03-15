import type {
  ForecastResponse,
  StaffingProposal,
  StaffingBlock,
  RoleStaffing,
  BlockId,
} from "@/lib/types";
import { ROLES } from "@/lib/constants/roles";
import { BLOCKS } from "@/lib/constants/blocks";

const ACUITY_MULTIPLIER = 2.0;
const OCCUPANCY_LOAD_FACTOR = 0.3;
const PREVIOUS_VARIANCE_MIN = 0.85;
const PREVIOUS_VARIANCE_MAX = 1.15;

/**
 * Compute hourly load combining non-severe, high-acuity, and occupancy signals.
 * L_h = nonSevere_h + 2.0 * highAcuity_h + 0.3 * occupancy_h
 */
function computeHourlyLoad(forecast: ForecastResponse): number[] {
  const loads: number[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const nonSevere = forecast.nonSevereArrivals.data[hour].p50;
    const highAcuity = forecast.highAcuityArrivals.data[hour].p50;
    const occupancy = forecast.edOccupancy.data[hour].p50;

    const load = nonSevere + ACUITY_MULTIPLIER * highAcuity + OCCUPANCY_LOAD_FACTOR * occupancy;
    loads.push(Math.round(load * 100) / 100);
  }

  return loads;
}

/**Find the maximum load and peak hour within a block's hour range.*/
function computeBlockPeak(
  hourlyLoads: number[],
  startHour: number,
  endHour: number,
): { blockLoad: number; peakHour: number } {
  let maxLoad = 0;
  let peakHour = startHour;

  for (let hour = startHour; hour < endHour; hour++) {
    if (hourlyLoads[hour] > maxLoad) {
      maxLoad = hourlyLoads[hour];
      peakHour = hour;
    }
  }

  return { blockLoad: Math.round(maxLoad * 100) / 100, peakHour };
}

/**Compute headcount for a single role given the block's peak load.*/
function computeRoleHeadcount(
  blockLoad: number,
  serviceRate: number,
  acuityWeight: number,
  occupancyWeight: number,
  minStaff: number,
): number {
  const roleWeight = (acuityWeight + occupancyWeight) / 2;
  const raw = (blockLoad * roleWeight) / serviceRate;
  return Math.max(minStaff, Math.ceil(raw));
}

/**Generate a simulated previous headcount for delta comparison.*/
function generatePreviousHeadcount(current: number): number {
  const variance = PREVIOUS_VARIANCE_MIN + Math.random() * (PREVIOUS_VARIANCE_MAX - PREVIOUS_VARIANCE_MIN);
  return Math.max(1, Math.round(current * variance));
}

/**Generate a plain-language rationale for a role's headcount in a block.*/
function buildRationale(
  roleName: string,
  headcount: number,
  blockLoad: number,
  peakHour: number,
): string {
  const peakTime = `${String(peakHour).padStart(2, "0")}:00`;
  return `${headcount} ${roleName}(s) needed based on peak load of ${blockLoad.toFixed(1)} at ${peakTime}`;
}

/**Generate staffing for all roles within a single block.*/
function generateBlockRoles(blockLoad: number, peakHour: number): RoleStaffing[] {
  return ROLES.map((role) => {
    const headcount = computeRoleHeadcount(
      blockLoad,
      role.serviceRate,
      role.acuityWeight,
      role.occupancyWeight,
      role.minStaff,
    );
    const previousHeadcount = generatePreviousHeadcount(headcount);

    return {
      role: role.name,
      headcount,
      previousHeadcount,
      delta: headcount - previousHeadcount,
      rationale: buildRationale(role.name, headcount, blockLoad, peakHour),
    };
  });
}

/**
 * Generate a staffing proposal with headcounts for all roles across all blocks.
 * Derives staffing from forecast load curves using role-specific service rates.
 */
export function generateStaffingProposal(forecast: ForecastResponse): StaffingProposal {
  const hourlyLoads = computeHourlyLoad(forecast);

  const blocks: StaffingBlock[] = BLOCKS.map((block) => {
    const { blockLoad, peakHour } = computeBlockPeak(hourlyLoads, block.startHour, block.endHour);

    return {
      blockId: block.id,
      startHour: block.startHour,
      endHour: block.endHour,
      label: block.label,
      roles: generateBlockRoles(blockLoad, peakHour),
      blockLoad,
      peakHour,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    scenarios: forecast.scenarios,
    riskPosture: forecast.riskPosture,
    blocks,
  };
}
