"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CTAS_LEVELS } from "@/lib/constants/ctas";
import type { CTASLevel } from "@/lib/types";

/**Format escalation path text for a given CTAS level.*/
function formatEscalation(level: CTASLevel): string {
  const parts: string[] = [];
  if (level.canEscalateTo !== null) parts.push(`Up to ${level.canEscalateTo}`);
  if (level.canDeescalateTo !== null) parts.push(`Down to ${level.canDeescalateTo}`);
  return parts.length > 0 ? parts.join(", ") : "None";
}

/**Single CTAS level row in the reference table.*/
function CTASRow({ level }: { level: CTASLevel }) {
  return (
    <tr className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: level.color }}
          />
          <span className="text-sm font-medium text-foreground tabular-nums">
            {level.level}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-foreground">{level.name}</td>
      <td className="px-3 py-2.5">
        <Badge variant={level.requiresOR ? "warning" : "default"}>
          {level.requiresOR ? "Yes" : "No"}
        </Badge>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {level.diagnosticRouting.length > 0 ? (
            level.diagnosticRouting.map((route) => (
              <Badge key={route} variant="outline" className="text-[10px]">
                {route}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-foreground tabular-nums text-right">
        {level.avgLengthOfStayHours}h
      </td>
      <td className="px-3 py-2.5 text-sm text-foreground tabular-nums text-right">
        {level.staffMultiplier}x
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {formatEscalation(level)}
      </td>
    </tr>
  );
}

/**Read-only CTAS reference table showing acuity configuration.*/
export function CTASReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acuity Configuration (CTAS)</CardTitle>
        <CardDescription>
          Canadian Triage and Acuity Scale reference — read-only
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Level</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Requires OR</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Diagnostics</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Avg LOS</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Staff Mult.</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Escalation</th>
              </tr>
            </thead>
            <tbody>
              {CTAS_LEVELS.map((level) => (
                <CTASRow key={level.level} level={level} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
