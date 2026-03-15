import type { BlockId } from "@/lib/types";

export interface BlockConfig {
  id: BlockId;
  startHour: number;
  endHour: number;
  label: string;
}

export const BLOCKS: BlockConfig[] = [
  { id: "B1", startHour: 0, endHour: 4, label: "00:00 \u2013 04:00" },
  { id: "B2", startHour: 4, endHour: 8, label: "04:00 \u2013 08:00" },
  { id: "B3", startHour: 8, endHour: 12, label: "08:00 \u2013 12:00" },
  { id: "B4", startHour: 12, endHour: 16, label: "12:00 \u2013 16:00" },
  { id: "B5", startHour: 16, endHour: 20, label: "16:00 \u2013 20:00" },
  { id: "B6", startHour: 20, endHour: 24, label: "20:00 \u2013 00:00" },
];
