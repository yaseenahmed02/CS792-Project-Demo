"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { AuditEntry as AuditEntryType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils";
import { ProvenanceDetail } from "./provenance-detail";
import { EVENT_TYPE_CONFIG } from "./event-type-config";

interface AuditEntryProps {
  entry: AuditEntryType;
}

/**Individual audit entry row with expandable provenance detail.*/
export function AuditEntryCard({ entry }: AuditEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = EVENT_TYPE_CONFIG[entry.eventType];

  return (
    <div className="py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start gap-3 text-left"
      >
        <time
          title={formatAbsoluteTime(entry.timestamp)}
          className="shrink-0 pt-0.5 text-xs font-mono text-muted-foreground w-16"
        >
          {formatRelativeTime(entry.timestamp)}
        </time>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
                config.bg,
                config.text,
              )}
            >
              {config.label}
            </span>
            {entry.blockId && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {entry.blockId}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-foreground leading-relaxed">
            {entry.summary}
          </p>
        </div>

        <ChevronRight
          className={cn(
            "mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform",
            isExpanded && "rotate-90",
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 ml-[76px]">
          <ProvenanceDetail detail={entry.detail} />
        </div>
      )}
    </div>
  );
}
