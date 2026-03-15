import { create } from "zustand";
import type { RiskPosture, ScenarioState } from "@/lib/types";

interface ScenarioStore {
  scenarios: ScenarioState;
  riskPosture: RiskPosture;
  toggleInfluenza: () => void;
  toggleMajorIncident: () => void;
  setRiskPosture: (posture: RiskPosture) => void;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: {
    influenzaOutbreak: false,
    majorIncident: false,
  },
  riskPosture: "normal",

  toggleInfluenza: () =>
    set((state) => ({
      scenarios: {
        ...state.scenarios,
        influenzaOutbreak: !state.scenarios.influenzaOutbreak,
      },
    })),

  toggleMajorIncident: () =>
    set((state) => ({
      scenarios: {
        ...state.scenarios,
        majorIncident: !state.scenarios.majorIncident,
      },
    })),

  setRiskPosture: (posture) => set({ riskPosture: posture }),
}));
