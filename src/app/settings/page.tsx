"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/lib/store";
import {
  ResourceConfig,
  EquipmentTable,
  CTASReference,
  ShiftTemplateTable,
  StaffPoolTable,
} from "@/components/settings";

/**Settings page with hospital configuration sections.*/
export default function SettingsPage() {
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Hospital configuration for the staffing optimizer
        </p>
      </div>

      <ResourceConfig />
      <EquipmentTable />
      <CTASReference />
      <ShiftTemplateTable />
      <StaffPoolTable />

      <div className="flex justify-end pb-8">
        <Button variant="outline" size="sm" onClick={resetToDefaults}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
