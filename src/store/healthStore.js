import { create } from "zustand";

export const useHealthStore = create((set) => ({
  vitals: {
    heartRate: null,
    spo2: null,
    temperature: null,
  },
  lastUpdated: null,

  setVitals: (data) =>
    set({
      vitals: data,
      lastUpdated: new Date(),
    }),
}));
