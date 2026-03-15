/**Format an hour (0-23) as "HH:00".*/
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**Format a time range as "HH:00 - HH:00".*/
export function formatTimeRange(start: number, end: number): string {
  const endDisplay = end === 24 ? 0 : end;
  return `${formatHour(start)} \u2013 ${formatHour(endDisplay)}`;
}

/**Format a numeric delta as "+N", "-N", or "0".*/
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

/**Format a value/total ratio as a percentage string like "72%".*/
export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}
