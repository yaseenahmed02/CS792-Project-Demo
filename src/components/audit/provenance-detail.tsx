"use client";

import type { AuditDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProvenanceDetailProps {
  detail: AuditDetail;
}

/**Expanded provenance view showing structured decision context.*/
export function ProvenanceDetail({ detail }: ProvenanceDetailProps) {
  return (
    <div className="space-y-3 text-xs">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <dt className="text-muted-foreground">Decision maker</dt>
        <dd className="text-foreground">{detail.decisionMaker}</dd>

        <dt className="text-muted-foreground">Risk posture</dt>
        <dd className="capitalize text-foreground">{detail.riskPosture}</dd>

        <dt className="text-muted-foreground">Active scenarios</dt>
        <dd className="text-foreground">
          <ScenarioText scenarios={detail.scenarios} />
        </dd>

        {detail.forecastContext && (
          <>
            <dt className="text-muted-foreground">Forecast context</dt>
            <dd className="font-mono text-foreground">
              Peak occupancy: {detail.forecastContext.peakOccupancy} / Peak
              arrivals: {detail.forecastContext.peakArrivals}/hr
            </dd>
          </>
        )}
      </dl>

      {detail.originalStaffing && detail.revisedStaffing && (
        <StaffingComparison
          original={detail.originalStaffing}
          revised={detail.revisedStaffing}
        />
      )}

      {detail.constraints && detail.constraints.length > 0 && (
        <ConstraintsList constraints={detail.constraints} />
      )}

      {detail.declineReason && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Decline reason:</span>{" "}
          {detail.declineReason}
        </p>
      )}

      {detail.manualOverrides && detail.manualOverrides.length > 0 && (
        <OverridesList overrides={detail.manualOverrides} />
      )}
    </div>
  );
}

function ScenarioText({
  scenarios,
}: {
  scenarios: AuditDetail["scenarios"];
}) {
  const active: string[] = [];
  if (scenarios.influenzaOutbreak) active.push("Influenza Outbreak");
  if (scenarios.majorIncident) active.push("Major Incident");

  if (active.length === 0) {
    return <span className="text-muted-foreground">None active</span>;
  }

  return <span>{active.join(", ")}</span>;
}

function StaffingComparison({
  original,
  revised,
}: {
  original: AuditDetail["originalStaffing"] & object;
  revised: AuditDetail["revisedStaffing"] & object;
}) {
  return (
    <div>
      <p className="mb-1 font-medium text-muted-foreground">
        Staffing comparison
      </p>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left font-medium text-muted-foreground">
              Role
            </th>
            <th className="py-1 text-right font-medium text-muted-foreground">
              Original
            </th>
            <th className="py-1 text-right font-medium text-muted-foreground">
              Revised
            </th>
            <th className="py-1 text-right font-medium text-muted-foreground">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {original.map((orig, i) => {
            const rev = revised[i];
            const delta = rev.headcount - orig.headcount;
            return (
              <tr key={orig.role} className="border-b last:border-b-0">
                <td className="py-1 text-foreground">{orig.role}</td>
                <td className="py-1 text-right font-mono tabular-nums text-muted-foreground">
                  {orig.headcount}
                </td>
                <td className="py-1 text-right font-mono tabular-nums text-foreground">
                  {rev.headcount}
                </td>
                <td
                  className={cn(
                    "py-1 text-right font-mono tabular-nums",
                    delta > 0
                      ? "text-emerald-600"
                      : delta < 0
                        ? "text-rose-600"
                        : "text-muted-foreground",
                  )}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConstraintsList({
  constraints,
}: {
  constraints: NonNullable<AuditDetail["constraints"]>;
}) {
  return (
    <div>
      <p className="mb-1 font-medium text-muted-foreground">
        Applied constraints
      </p>
      <ul className="space-y-0.5">
        {constraints.map((c, i) => (
          <li key={i} className="text-foreground">
            {c.role}: {c.type} {c.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverridesList({
  overrides,
}: {
  overrides: NonNullable<AuditDetail["manualOverrides"]>;
}) {
  return (
    <div>
      <p className="mb-1 font-medium text-muted-foreground">
        Manual overrides
      </p>
      <ul className="space-y-0.5">
        {overrides.map((o, i) => (
          <li key={i} className="text-foreground">
            {o.role}: {o.from} &rarr; {o.to}
            <span
              className={cn(
                "ml-1",
                o.to > o.from ? "text-emerald-600" : "text-rose-600",
              )}
            >
              ({o.to > o.from ? "+" : ""}
              {o.to - o.from})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
