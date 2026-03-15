import { NextRequest, NextResponse } from "next/server";
import type { RiskPosture, ScenarioState } from "@/lib/types";
import { generateForecast } from "@/lib/generators";

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
 * GET /api/forecast
 * Query params: influenzaOutbreak, majorIncident, riskPosture
 * Returns a ForecastResponse with 24-hour P10/P50/P90 series.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const scenarios: ScenarioState = {
    influenzaOutbreak: parseBoolParam(params.get("influenzaOutbreak")),
    majorIncident: parseBoolParam(params.get("majorIncident")),
  };

  const riskPosture = parseRiskPosture(params.get("riskPosture"));
  const forecast = generateForecast(scenarios, riskPosture);

  return NextResponse.json(forecast);
}
