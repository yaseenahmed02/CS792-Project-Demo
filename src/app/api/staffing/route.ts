import { NextRequest, NextResponse } from "next/server";
import type { RiskPosture, ScenarioState } from "@/lib/types";
import { generateForecast, generateStaffingProposal } from "@/lib/generators";
import { DEFAULT_HOSPITAL_CONFIG } from "@/lib/constants";

/**Parse a query param string as a boolean, defaulting to false.*/
function parseBoolParam(value: string | null): boolean {
  return value === "true";
}

/**Validate that a string is a valid RiskPosture value.*/
function parseRiskPosture(value: string | null): RiskPosture {
  const valid: RiskPosture[] = ["normal", "elevated", "critical"];
  if (value && valid.includes(value as RiskPosture)) {
    return value as RiskPosture;
  }
  return "normal";
}

/**
 * GET /api/staffing
 * Query params: influenzaOutbreak, majorIncident, riskPosture
 * Generates a forecast, then derives a staffing proposal from it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const scenarios: ScenarioState = {
    influenzaOutbreak: parseBoolParam(params.get("influenzaOutbreak")),
    majorIncident: parseBoolParam(params.get("majorIncident")),
  };

  const riskPosture = parseRiskPosture(params.get("riskPosture"));
  const forecast = generateForecast(scenarios, riskPosture, DEFAULT_HOSPITAL_CONFIG);
  const proposal = generateStaffingProposal(forecast, DEFAULT_HOSPITAL_CONFIG);

  return NextResponse.json(proposal);
}
