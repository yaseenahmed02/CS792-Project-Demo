"use client";

import { Bug, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useScenarioStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";

interface ScenarioToggleConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
  activeIconColor: string;
}

/**Single scenario toggle row with icon, label, and switch.*/
function ScenarioToggleRow({
  label,
  description,
  icon,
  isActive,
  onToggle,
  activeIconColor,
}: ScenarioToggleConfig) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isActive ? "bg-muted/50" : "bg-transparent"
      )}
    >
      <div className={cn(
        "transition-colors",
        isActive ? activeIconColor : "text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={isActive} onCheckedChange={onToggle} />
    </div>
  );
}

/**Two toggle switches for Influenza Outbreak and Major Incident scenarios.*/
export function ScenarioToggles() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const toggleInfluenza = useScenarioStore((s) => s.toggleInfluenza);
  const toggleMajorIncident = useScenarioStore((s) => s.toggleMajorIncident);

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-foreground mb-3">Scenarios</h3>
      <div className="space-y-1">
        <ScenarioToggleRow
          label="Influenza Outbreak"
          description="Surge in respiratory presentations (+40% non-severe)"
          icon={<Bug className="h-4 w-4" />}
          isActive={scenarios.influenzaOutbreak}
          onToggle={toggleInfluenza}
          activeIconColor="text-amber-500"
        />
        <ScenarioToggleRow
          label="Major Incident"
          description="Mass casualty event (+150% high-acuity arrivals)"
          icon={<AlertTriangle className="h-4 w-4" />}
          isActive={scenarios.majorIncident}
          onToggle={toggleMajorIncident}
          activeIconColor="text-rose-500"
        />
      </div>
    </div>
  );
}
