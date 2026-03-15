import type {
  ReSuggestRequest,
  ReSuggestResponse,
  RoleStaffing,
  StaffingConstraint,
  RoleName,
} from "@/lib/types";
import { ROLES } from "@/lib/constants/roles";

/**Apply a single constraint to a headcount value.*/
function applyConstraint(headcount: number, constraint: StaffingConstraint): number {
  switch (constraint.type) {
    case "min":
      return Math.max(headcount, constraint.value);
    case "max":
      return Math.min(headcount, constraint.value);
    case "exact":
      return constraint.value;
  }
}

/**Find the constraint for a specific role, if one exists.*/
function findConstraintForRole(
  role: RoleName,
  constraints: StaffingConstraint[],
): StaffingConstraint | undefined {
  return constraints.find((c) => c.role === role);
}

/**
 * Compute the total headcount difference after applying constraints.
 * Positive means we added staff; negative means we reduced.
 */
function computeTotalDelta(original: RoleStaffing[], revised: RoleStaffing[]): number {
  const originalTotal = original.reduce((sum, r) => sum + r.headcount, 0);
  const revisedTotal = revised.reduce((sum, r) => sum + r.headcount, 0);
  return revisedTotal - originalTotal;
}

/**Build an explanation describing what changed and why.*/
function buildExplanation(
  constraints: StaffingConstraint[],
  satisfied: boolean,
  totalDelta: number,
): string {
  const parts: string[] = [];

  for (const constraint of constraints) {
    parts.push(`${constraint.role}: ${constraint.type} = ${constraint.value}`);
  }

  const direction = totalDelta > 0 ? `+${totalDelta}` : `${totalDelta}`;
  const summary = `Applied ${constraints.length} constraint(s): ${parts.join("; ")}. Net staffing change: ${direction}.`;

  if (!satisfied) {
    return `${summary} Warning: not all constraints could be fully satisfied while maintaining minimum staffing levels.`;
  }

  return summary;
}

/**
 * Generate a revised staffing suggestion that satisfies the given constraints.
 * Adjusts constrained roles first, then redistributes to maintain coverage.
 */
export function generateReSuggestion(
  request: ReSuggestRequest,
  originalStaffing: RoleStaffing[],
): ReSuggestResponse {
  let allSatisfied = true;

  const revised: RoleStaffing[] = originalStaffing.map((original) => {
    const constraint = findConstraintForRole(original.role, request.constraints);

    if (!constraint) {
      return { ...original };
    }

    const roleConfig = ROLES.find((r) => r.name === original.role);
    const minStaff = roleConfig?.minStaff ?? 1;

    let newHeadcount = applyConstraint(original.headcount, constraint);
    newHeadcount = Math.max(newHeadcount, minStaff);

    if (newHeadcount !== constraint.value && constraint.type === "exact") {
      allSatisfied = false;
    }

    return {
      ...original,
      headcount: newHeadcount,
      previousHeadcount: original.headcount,
      delta: newHeadcount - original.headcount,
      rationale: `Adjusted from ${original.headcount} to ${newHeadcount} per ${constraint.type} constraint (${constraint.value})`,
    };
  });

  const totalDelta = computeTotalDelta(originalStaffing, revised);

  return {
    blockId: request.blockId,
    original: originalStaffing,
    revised,
    explanation: buildExplanation(request.constraints, allSatisfied, totalDelta),
    constraintsSatisfied: allSatisfied,
  };
}
