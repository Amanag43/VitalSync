import { create } from "zustand";

export const useEmergencyStore = create((set, get) => ({
  // 🔴 Emergency State
  emergencyActive: false,
  emergencyReason: null,

  // 🚨 Start Emergency
  startEmergency: (reason) =>
    set({
      emergencyActive: true,
      emergencyReason: reason,
    }),

  // ✅ Stop / Clear Emergency
  stopEmergency: () =>
    set({
      emergencyActive: false,
      emergencyReason: null,
    }),

  // 🧠 Helper (optional, safe)
  isEmergency: () => get().emergencyActive,
}));
