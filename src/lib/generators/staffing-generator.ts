import type {
  ForecastResponse,
  StaffingProposal,
  StaffingShift,
  RoleStaffing,
  HourlyRoleDemand,
  ResourceUtilization,
  HospitalConfig,
  RoleName,
  ShiftTemplate,
} from "@/lib/types";
import { ROLES, type RoleConfig } from "@/lib/constants/roles";
import { DEFAULT_HOSPITAL_CONFIG } from "@/lib/constants/hospital-config";
import {
  computeHourlyRoleDemand,
  adjustForRiskPosture,
} from "./demand-computation";

const PREVIOUS_VARIANCE_MIN = 0.85;
const PREVIOUS_VARIANCE_MAX = 1.15;
const HOURS_IN_DAY = 24;

// Re-export for consumers that imported from this module
export { computeHourlyRoleDemand, adjustForRiskPosture };

// ---------------------------------------------------------------------------
// Shift optimization (greedy)
// ---------------------------------------------------------------------------

/**Get the hours covered by a shift, handling overnight wrapping.*/
function getShiftHours(start: number, end: number, isOvernight: boolean): number[] {
  const hours: number[] = [];
  if (isOvernight) {
    for (let h = start; h < HOURS_IN_DAY; h++) hours.push(h);
    for (let h = 0; h < end; h++) hours.push(h);
  } else {
    for (let h = start; h < end; h++) hours.push(h);
  }
  return hours;
}

/**Compute residual demand after subtracting existing coverage.*/
function computeResidual(
  demand: HourlyRoleDemand[],
  coverage: number[][],
): number[][] {
  return demand.map((hourDemand, hour) =>
    ROLES.map((role, ri) => Math.max(0, hourDemand.roles[role.name] - coverage[hour][ri])),
  );
}

/**
 * Greedy shift assignment: core shifts first, then swing, then flex.
 * Each shift gets the peak residual headcount for its hour window.
 */
export function optimizeShiftCoverage(
  hourlyDemand: HourlyRoleDemand[],
  shiftTemplates: ShiftTemplate[],
  staffPool: Record<RoleName, number>,
): StaffingShift[] {
  const coverage: number[][] = Array.from({ length: HOURS_IN_DAY }, () =>
    Array(ROLES.length).fill(0),
  );
  const poolRemaining = { ...staffPool };
  const shifts: StaffingShift[] = [];

  const orderedTemplates = orderTemplatesByCategory(shiftTemplates);

  for (const template of orderedTemplates) {
    const shift = assignShift(template, hourlyDemand, coverage, poolRemaining);
    shifts.push(shift);
  }

  return shifts;
}

/**Order shift templates: core first, then swing, then flex.*/
function orderTemplatesByCategory(templates: ShiftTemplate[]): ShiftTemplate[] {
  const order: Record<string, number> = { core: 0, swing: 1, flex: 2 };
  return [...templates].sort((a, b) => (order[a.category] ?? 0) - (order[b.category] ?? 0));
}

/**Assign headcounts for all roles in a single shift template.*/
function assignShift(
  template: ShiftTemplate,
  demand: HourlyRoleDemand[],
  coverage: number[][],
  poolRemaining: Record<RoleName, number>,
): StaffingShift {
  const hours = getShiftHours(template.startHour, template.endHour, template.isOvernight);
  const residual = computeResidual(demand, coverage);
  const roles: RoleStaffing[] = [];
  let maxShiftLoad = 0;
  let shiftPeakHour = hours[0] ?? 0;

  for (let ri = 0; ri < ROLES.length; ri++) {
    const role = ROLES[ri];
    if (!role.canWorkShiftCategories.includes(template.category)) {
      roles.push(buildZeroRoleStaffing(role.name));
      continue;
    }

    const { headcount, peakHour, peakValue, understaffed } =
      computeShiftRoleHeadcount(role, ri, hours, residual, poolRemaining);

    updateCoverage(coverage, hours, ri, headcount);
    poolRemaining[role.name] = Math.max(0, (poolRemaining[role.name] ?? 0) - headcount);

    const rationale = buildShiftRationale(role.name, headcount, peakValue, peakHour, understaffed);
    const previousHeadcount = generatePreviousHeadcount(headcount);

    roles.push({
      role: role.name,
      headcount,
      previousHeadcount,
      delta: headcount - previousHeadcount,
      rationale,
    });

    if (peakValue > maxShiftLoad) {
      maxShiftLoad = peakValue;
      shiftPeakHour = peakHour;
    }
  }

  return {
    shiftId: template.id,
    name: template.name,
    startHour: template.startHour,
    endHour: template.endHour,
    isOvernight: template.isOvernight,
    category: template.category,
    roles,
    shiftLoad: Math.round(maxShiftLoad * 100) / 100,
    peakHour: shiftPeakHour,
  };
}

/**Compute headcount for a role within a shift, capped by staff pool.*/
function computeShiftRoleHeadcount(
  role: RoleConfig,
  roleIndex: number,
  hours: number[],
  residual: number[][],
  poolRemaining: Record<RoleName, number>,
): { headcount: number; peakHour: number; peakValue: number; understaffed: boolean } {
  let peakResidual = 0;
  let peakHour = hours[0] ?? 0;

  for (const h of hours) {
    const value = residual[h]?.[roleIndex] ?? 0;
    if (value > peakResidual) {
      peakResidual = value;
      peakHour = h;
    }
  }

  let headcount = Math.ceil(peakResidual);
  const available = poolRemaining[role.name] ?? 0;
  let understaffed = false;

  if (headcount > available) {
    headcount = available;
    understaffed = true;
  }

  return { headcount, peakHour, peakValue: peakResidual, understaffed };
}

/**Add headcount to coverage array for all hours in the shift.*/
function updateCoverage(
  coverage: number[][],
  hours: number[],
  roleIndex: number,
  headcount: number,
): void {
  for (const h of hours) {
    coverage[h][roleIndex] += headcount;
  }
}

/**Build a zero-headcount role staffing for roles that cannot work this shift.*/
function buildZeroRoleStaffing(role: RoleName): RoleStaffing {
  return {
    role,
    headcount: 0,
    previousHeadcount: 0,
    delta: 0,
    rationale: "Not scheduled for this shift category",
  };
}

// ---------------------------------------------------------------------------
// Hourly coverage computation
// ---------------------------------------------------------------------------

/**Compute actual hourly coverage by summing headcount from all active shifts.*/
export function computeHourlyCoverage(shifts: StaffingShift[]): HourlyRoleDemand[] {
  const coverage: HourlyRoleDemand[] = Array.from({ length: HOURS_IN_DAY }, (_, hour) => ({
    hour,
    roles: Object.fromEntries(ROLES.map((r) => [r.name, 0])) as Record<RoleName, number>,
  }));

  for (const shift of shifts) {
    const hours = getShiftHours(shift.startHour, shift.endHour, shift.isOvernight);
    for (const h of hours) {
      for (const roleStaffing of shift.roles) {
        coverage[h].roles[roleStaffing.role] += roleStaffing.headcount;
      }
    }
  }

  return coverage;
}

// ---------------------------------------------------------------------------
// Resource utilization (pass-through from forecast)
// ---------------------------------------------------------------------------

/**Extract resource utilization data from the forecast.*/
function extractResourceUtilization(forecast: ForecastResponse): ResourceUtilization {
  const orUtilization = forecast.orUtilization.data.map((p) => p.p50);
  const equipmentUtilization: Record<string, number[]> = {};

  for (const [key, series] of Object.entries(forecast.equipmentUtilization)) {
    equipmentUtilization[key] = series.data.map((p) => p.p50);
  }

  return { orUtilization, equipmentUtilization };
}

// ---------------------------------------------------------------------------
// Rationale and previous headcount helpers
// ---------------------------------------------------------------------------

/**Generate a simulated previous headcount for delta comparison.*/
function generatePreviousHeadcount(current: number): number {
  if (current === 0) return 0;
  const variance = PREVIOUS_VARIANCE_MIN + Math.random() * (PREVIOUS_VARIANCE_MAX - PREVIOUS_VARIANCE_MIN);
  return Math.max(1, Math.round(current * variance));
}

/**Build a descriptive rationale string for a role's shift assignment.*/
function buildShiftRationale(
  roleName: string,
  headcount: number,
  peakDemand: number,
  peakHour: number,
  understaffed: boolean,
): string {
  if (headcount === 0) return "No additional coverage needed";
  const peakTime = `${String(peakHour).padStart(2, "0")}:00`;
  const base = `${headcount} ${roleName}(s) needed — peak demand of ${peakDemand.toFixed(1)} at ${peakTime}`;
  if (understaffed) {
    return `${base} (UNDERSTAFFED: limited by staff pool)`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate a complete staffing proposal from a forecast.
 * Pipeline: forecast -> hourly demand -> risk adjustment -> shift optimization -> proposal.
 */
export function generateStaffingProposal(
  forecast: ForecastResponse,
  config?: HospitalConfig,
): StaffingProposal {
  const hospitalConfig = config ?? DEFAULT_HOSPITAL_CONFIG;

  const rawDemand = computeHourlyRoleDemand(forecast, hospitalConfig);
  const adjustedDemand = adjustForRiskPosture(rawDemand, forecast, forecast.riskPosture);
  const shifts = optimizeShiftCoverage(
    adjustedDemand,
    hospitalConfig.shiftTemplates,
    hospitalConfig.staffPool,
  );
  const hourlyCoverage = computeHourlyCoverage(shifts);
  const resourceUtilization = extractResourceUtilization(forecast);

  return {
    generatedAt: new Date().toISOString(),
    scenarios: forecast.scenarios,
    riskPosture: forecast.riskPosture,
    shifts,
    hourlyDemand: adjustedDemand,
    hourlyCoverage,
    resourceUtilization,
  };
}
