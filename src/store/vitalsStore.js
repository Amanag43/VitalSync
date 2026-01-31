import { create } from "zustand";
export const useVitalsStore = create((set) => ({
  vitals: null,
  lastUpdated: null,
  setVitals: (data) =>
    set({
      vitals: data,
      lastUpdated: Date.now(),
    }),
}));
