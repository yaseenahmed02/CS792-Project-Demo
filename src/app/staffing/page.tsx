"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShiftTimeline,
  StaffingGrid,
  DemandCoverageChart,
} from "@/components/staffing";
import { useStaffing } from "@/hooks/use-staffing";
import { useStaffingStore, useAuditStore, useScenarioStore } from "@/lib/store";
import { toast } from "sonner";

/**Staffing proposals page: timeline, demand chart, grid, and export controls.*/
export default function StaffingPage() {
  const { proposal, isLoading, error } = useStaffing();
  const decisions = useStaffingStore((s) => s.decisions);
  const initializeFromProposal = useStaffingStore((s) => s.initializeFromProposal);
  const allDecided = useStaffingStore((s) => s.allDecided);
  const addAuditEntry = useAuditStore((s) => s.addEntry);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const riskPosture = useScenarioStore((s) => s.riskPosture);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!proposal) return;

    initializeFromProposal(proposal);
    setIsInitialized(true);

    addAuditEntry({
      eventType: "proposal_generated",
      summary: `Staffing proposal generated for ${{ normal: "lean", elevated: "standard", critical: "surge" }[riskPosture]} risk posture`,
      detail: {
        decisionMaker: "System",
        riskPosture,
        scenarios,
      },
    });
  }, [proposal]);

  function handleExportSchedule() {
    addAuditEntry({
      eventType: "schedule_exported",
      summary: "Final schedule exported",
      detail: { decisionMaker: "Charge Nurse", riskPosture, scenarios },
    });
    toast.success("Schedule exported successfully");
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md rounded-lg border p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !proposal || !isInitialized) {
    return <StaffingPageSkeleton />;
  }

  const isAllDecided = allDecided();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Staffing proposals
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review and decide on staffing for each shift
          </p>
        </div>
        {isAllDecided && (
          <Button variant="outline" size="sm" onClick={handleExportSchedule}>
            <Download className="h-3.5 w-3.5" />
            Export schedule
          </Button>
        )}
      </div>

      {/* Shift timeline */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          24-hour shift overview
        </p>
        <ShiftTimeline
          shifts={proposal.shifts}
          decisions={decisions}
        />
      </div>

      {/* Demand vs coverage chart */}
      <DemandCoverageChart
        hourlyDemand={proposal.hourlyDemand}
        hourlyCoverage={proposal.hourlyCoverage}
        shifts={proposal.shifts}
      />

      {/* Staffing grid */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Staffing grid
        </p>
        <div className="rounded-lg border">
          <StaffingGrid shifts={proposal.shifts} decisions={decisions} />
        </div>
      </div>
    </div>
  );
}

function StaffingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-24 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
      <div>
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 space-y-px">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
