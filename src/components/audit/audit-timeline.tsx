"use client";

import type { AuditEntry } from "@/lib/types";
import { AuditEntryCard } from "./audit-entry";

interface AuditTimelineProps {
  entries: AuditEntry[];
}

/**Feed of audit entries displayed as a simple stacked list.*/
export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No audit entries
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Entries will appear here as decisions are made.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {entries.map((entry) => (
        <AuditEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
