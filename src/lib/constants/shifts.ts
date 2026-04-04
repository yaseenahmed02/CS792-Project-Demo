import type { ShiftTemplate } from "@/lib/types";

export const DEFAULT_SHIFTS: ShiftTemplate[] = [
  { id: "day", name: "Day Shift", startHour: 7, endHour: 15, isOvernight: false, category: "core" },
  { id: "evening", name: "Evening Shift", startHour: 15, endHour: 23, isOvernight: false, category: "core" },
  { id: "night", name: "Night Shift", startHour: 23, endHour: 7, isOvernight: true, category: "core" },
  { id: "swing-am", name: "Morning Swing", startHour: 11, endHour: 15, isOvernight: false, category: "swing" },
  { id: "swing-pm", name: "Afternoon Swing", startHour: 15, endHour: 19, isOvernight: false, category: "swing" },
  { id: "flex", name: "On-Call Flex", startHour: 19, endHour: 23, isOvernight: false, category: "flex" },
];
