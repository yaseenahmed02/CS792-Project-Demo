import { NextRequest, NextResponse } from "next/server";
import type { ReSuggestRequest, RoleStaffing } from "@/lib/types";
import { generateReSuggestion } from "@/lib/generators";

const SIMULATED_DELAY_MS = 1500;

/**Pause execution to simulate AI processing time.*/
function simulateThinking(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

/**
 * POST /api/staffing/re-suggest
 * Body: ReSuggestRequest (blockId, constraints, riskPosture, scenarios)
 * Also requires `originalStaffing` in the body for the re-suggestion base.
 * Returns a ReSuggestResponse after a simulated delay.
 */
export async function POST(request: NextRequest) {
  let body: ReSuggestRequest & { originalStaffing?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  if (!body.blockId || !body.constraints || !Array.isArray(body.constraints)) {
    return NextResponse.json(
      { error: "Missing required fields: blockId, constraints" },
      { status: 400 },
    );
  }

  if (!body.originalStaffing || !Array.isArray(body.originalStaffing)) {
    return NextResponse.json(
      { error: "Missing required field: originalStaffing" },
      { status: 400 },
    );
  }

  // Simulate AI thinking time
  await simulateThinking();

  const response = generateReSuggestion(
    {
      blockId: body.blockId,
      constraints: body.constraints,
      riskPosture: body.riskPosture,
      scenarios: body.scenarios,
    },
    body.originalStaffing as RoleStaffing[],
  );

  return NextResponse.json(response);
}
