"use client";

import { useMemo, useState } from "react";
import { useAuditStore } from "@/lib/store";
import {
  AuditTimeline,
  AuditFilters,
  createDefaultFilters,
  type AuditFilterState,
} from "@/components/audit";
import type { AuditEntry } from "@/lib/types";

/**Audit log page with filterable feed of all staffing decisions.*/
export default function AuditPage() {
  const entries = useAuditStore((s) => s.entries);
  const [filters, setFilters] = useState<AuditFilterState>(createDefaultFilters);

  const filteredEntries = useMemo(
    () => applyFilters(entries, filters),
    [entries, filters],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Audit log</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Decision provenance and accountability trail
        </p>
      </div>

      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        matchingCount={filteredEntries.length}
        totalCount={entries.length}
      />

      <AuditTimeline entries={filteredEntries} />
    </div>
  );
}

function applyFilters(entries: AuditEntry[], filters: AuditFilterState): AuditEntry[] {
  let result = entries.filter((entry) => {
    if (!filters.eventTypes.has(entry.eventType)) return false;
    if (entry.blockId && !filters.blocks.has(entry.blockId)) return false;
    return true;
  });

  if (!filters.sortNewestFirst) {
    result = [...result].reverse();
  }

  return result;
}
