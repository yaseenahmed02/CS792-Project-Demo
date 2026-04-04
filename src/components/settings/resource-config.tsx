"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSettingsStore } from "@/lib/store";

const MIN_OPERATING_ROOMS = 1;
const MAX_OPERATING_ROOMS = 10;
const MIN_BEDS = 10;
const MAX_BEDS = 200;

/**Labeled number input with min/max validation.*/
function NumberField({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) return;
    onChange(Math.min(max, Math.max(min, raw)));
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="h-9 w-20 rounded-[7px] border bg-background px-3 text-sm text-foreground text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

/**Hospital resources section: OR count and total beds.*/
export function ResourceConfig() {
  const operatingRooms = useSettingsStore((s) => s.operatingRooms);
  const totalBeds = useSettingsStore((s) => s.totalBeds);
  const updateOperatingRooms = useSettingsStore((s) => s.updateOperatingRooms);
  const updateTotalBeds = useSettingsStore((s) => s.updateTotalBeds);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Resources</CardTitle>
        <CardDescription>
          Physical capacity used by the staffing optimizer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <NumberField
            label="Operating Rooms"
            description={`Available ORs for emergency cases (${MIN_OPERATING_ROOMS}-${MAX_OPERATING_ROOMS})`}
            value={operatingRooms}
            min={MIN_OPERATING_ROOMS}
            max={MAX_OPERATING_ROOMS}
            onChange={updateOperatingRooms}
          />
          <NumberField
            label="Total Beds"
            description={`ED bed capacity (${MIN_BEDS}-${MAX_BEDS})`}
            value={totalBeds}
            min={MIN_BEDS}
            max={MAX_BEDS}
            onChange={updateTotalBeds}
          />
        </div>
      </CardContent>
    </Card>
  );
}
