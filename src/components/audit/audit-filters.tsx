"use client";

import type { AuditEventType, BlockId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG } from "./event-type-config";

const ALL_EVENT_TYPES: AuditEventType[] = [
  "proposal_generated",
  "block_accepted",
  "block_declined",
  "manual_override",
  "re_suggest_requested",
  "re_suggest_accepted",
  "schedule_exported",
];

const ALL_BLOCKS: BlockId[] = ["B1", "B2", "B3", "B4", "B5", "B6"];

export interface AuditFilterState {
  eventTypes: Set<AuditEventType>;
  blocks: Set<BlockId>;
  sortNewestFirst: boolean;
}

interface AuditFiltersProps {
  filters: AuditFilterState;
  onFiltersChange: (filters: AuditFilterState) => void;
  matchingCount: number;
  totalCount: number;
}

/**Filter bar for the audit log with event type and block toggles.*/
export function AuditFilters({
  filters,
  onFiltersChange,
  matchingCount,
  totalCount,
}: AuditFiltersProps) {
  const hasActiveFilters =
    filters.eventTypes.size < ALL_EVENT_TYPES.length ||
    filters.blocks.size < ALL_BLOCKS.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {ALL_EVENT_TYPES.map((type) => {
          const config = EVENT_TYPE_CONFIG[type];
          const isActive = filters.eventTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleEventType(type, filters, onFiltersChange)}
              className={cn(
                "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground",
              )}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {ALL_BLOCKS.map((block) => {
            const isActive = filters.blocks.has(block);
            return (
              <button
                key={block}
                onClick={() => toggleBlock(block, filters, onFiltersChange)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-mono font-medium transition-colors",
                  isActive
                    ? "bg-foreground/[0.08] text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                {block}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => toggleSort(filters, onFiltersChange)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {filters.sortNewestFirst ? "Newest first" : "Oldest first"}
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => clearFilters(onFiltersChange)}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {matchingCount === totalCount
            ? `${totalCount} entries`
            : `${matchingCount} of ${totalCount}`}
        </span>
      </div>
    </div>
  );
}

function toggleEventType(
  type: AuditEventType,
  filters: AuditFilterState,
  onChange: (f: AuditFilterState) => void,
): void {
  const next = new Set(filters.eventTypes);
  if (next.has(type)) {
    next.delete(type);
  } else {
    next.add(type);
  }
  onChange({ ...filters, eventTypes: next });
}

function toggleBlock(
  block: BlockId,
  filters: AuditFilterState,
  onChange: (f: AuditFilterState) => void,
): void {
  const next = new Set(filters.blocks);
  if (next.has(block)) {
    next.delete(block);
  } else {
    next.add(block);
  }
  onChange({ ...filters, blocks: next });
}

function toggleSort(
  filters: AuditFilterState,
  onChange: (f: AuditFilterState) => void,
): void {
  onChange({ ...filters, sortNewestFirst: !filters.sortNewestFirst });
}

function clearFilters(onChange: (f: AuditFilterState) => void): void {
  onChange({
    eventTypes: new Set(ALL_EVENT_TYPES),
    blocks: new Set(ALL_BLOCKS),
    sortNewestFirst: true,
  });
}

/**Create initial filter state with everything selected.*/
export function createDefaultFilters(): AuditFilterState {
  return {
    eventTypes: new Set(ALL_EVENT_TYPES),
    blocks: new Set(ALL_BLOCKS),
    sortNewestFirst: true,
  };
}
