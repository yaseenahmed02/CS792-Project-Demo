import type { AuditEventType } from "@/lib/types";

interface EventTypeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  borderColor: string;
  dotColor: string;
}

/**
 * Visual configuration for each audit event type.
 * Uses muted, desaturated colors with very light tint backgrounds.
 */
export const EVENT_TYPE_CONFIG: Record<AuditEventType, EventTypeStyle> = {
  proposal_generated: {
    label: "Proposal generated",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    borderColor: "border-l-blue-400",
    dotColor: "bg-blue-400",
  },
  block_accepted: {
    label: "Accepted",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    borderColor: "border-l-emerald-400",
    dotColor: "bg-emerald-400",
  },
  block_declined: {
    label: "Declined",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    borderColor: "border-l-rose-400",
    dotColor: "bg-rose-400",
  },
  manual_override: {
    label: "Manual override",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    borderColor: "border-l-blue-400",
    dotColor: "bg-blue-400",
  },
  re_suggest_requested: {
    label: "Re-suggest requested",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    borderColor: "border-l-amber-400",
    dotColor: "bg-amber-400",
  },
  re_suggest_accepted: {
    label: "Re-suggest accepted",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    borderColor: "border-l-amber-400",
    dotColor: "bg-amber-400",
  },
  schedule_exported: {
    label: "Exported",
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    borderColor: "border-l-violet-400",
    dotColor: "bg-violet-400",
  },
};
