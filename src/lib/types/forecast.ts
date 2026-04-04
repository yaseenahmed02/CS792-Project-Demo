export type RiskPosture = "normal" | "elevated" | "critical";

export interface ForecastPoint {
  hour: number; // 0-23
  timestamp: string; // ISO string
  p10: number;
  p50: number;
  p90: number;
}

export interface ForecastSeries {
  label: string;
  unit: string;
  data: ForecastPoint[];
}

export interface ForecastResponse {
  generatedAt: string;
  scenarios: ScenarioState;
  riskPosture: RiskPosture;
  ctasArrivals: Record<number, ForecastSeries>;
  edOccupancy: ForecastSeries;
  orUtilization: ForecastSeries;
  equipmentUtilization: Record<string, ForecastSeries>;
}

export interface ScenarioState {
  influenzaOutbreak: boolean;
  majorIncident: boolean;
}
