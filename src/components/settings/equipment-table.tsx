"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSettingsStore } from "@/lib/store";
import type { DiagnosticEquipment } from "@/lib/types";
import { CTAS_LEVELS } from "@/lib/constants/ctas";

/**Inline editable cell for numeric equipment fields.*/
function EditableNumberCell({
  value,
  min,
  onChange,
}: {
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) return;
    onChange(Math.max(min, raw));
  }

  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={handleChange}
      className="h-8 w-16 rounded-[7px] border bg-background px-2 text-sm text-foreground text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

/**CTAS level badges for an equipment row.*/
function CTASBadges({ levels }: { levels: number[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {levels.map((level) => {
        const ctas = CTAS_LEVELS.find((c) => c.level === level);
        return (
          <Badge key={level} variant="outline" className="text-[10px] px-1.5">
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ctas?.color ?? "#888" }}
            />
            {level}
          </Badge>
        );
      })}
    </div>
  );
}

/**Single equipment row in the table.*/
function EquipmentRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: DiagnosticEquipment;
  onUpdate: (updated: DiagnosticEquipment) => void;
  onRemove: () => void;
}) {
  return (
    <tr className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
      <td className="px-3 py-2.5 text-sm text-foreground">{item.name}</td>
      <td className="px-3 py-2.5">
        <EditableNumberCell
          value={item.count}
          min={1}
          onChange={(count) => onUpdate({ ...item, count })}
        />
      </td>
      <td className="px-3 py-2.5">
        <EditableNumberCell
          value={item.avgUsageMinutes}
          min={1}
          onChange={(avgUsageMinutes) => onUpdate({ ...item, avgUsageMinutes })}
        />
      </td>
      <td className="px-3 py-2.5">
        <CTASBadges levels={item.requiredForCTAS} />
      </td>
      <td className="px-3 py-2.5">
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </td>
    </tr>
  );
}

/**Creates a new equipment item with a unique ID.*/
function createEquipmentItem(): DiagnosticEquipment {
  return {
    id: `equip-${Date.now()}`,
    name: "New Equipment",
    count: 1,
    avgUsageMinutes: 15,
    requiredForCTAS: [],
  };
}

/**Diagnostic equipment management table with add/remove/edit.*/
export function EquipmentTable() {
  const equipment = useSettingsStore((s) => s.diagnosticEquipment);
  const updateEquipment = useSettingsStore((s) => s.updateEquipment);

  function handleUpdateItem(index: number, updated: DiagnosticEquipment) {
    const next = [...equipment];
    next[index] = updated;
    updateEquipment(next);
  }

  function handleRemoveItem(index: number) {
    updateEquipment(equipment.filter((_, i) => i !== index));
  }

  function handleAddItem() {
    updateEquipment([...equipment, createEquipmentItem()]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic Equipment</CardTitle>
        <CardDescription>
          Equipment availability affects patient routing and wait times
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Count</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Avg Usage (min)</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">CTAS Levels</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {equipment.map((item, index) => (
                <EquipmentRow
                  key={item.id}
                  item={item}
                  onUpdate={(updated) => handleUpdateItem(index, updated)}
                  onRemove={() => handleRemoveItem(index)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleAddItem}>
          <Plus className="h-3.5 w-3.5" />
          Add equipment
        </Button>
      </CardContent>
    </Card>
  );
}
