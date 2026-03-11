import { create } from "zustand";

export const useEmergencyStore = create((set, get) => ({
  // 🔴 Core State
  emergencyActive: false,
  emergencyReason: null,
  emergencyStartedAt: null,

  // 📍 Context Data
  lastVitals: null,
  lastLocation: null,

  // 🚨 Start Emergency
  startEmergency: (reason, vitals = null, location = null) => {
    const alreadyActive = get().emergencyActive;

    // ❗ Prevent duplicate triggers
    if (alreadyActive) return;

    set({
      emergencyActive: true,
      emergencyReason: reason,
      emergencyStartedAt: new Date(),
      lastVitals: vitals,
      lastLocation: location,
    });

    console.log("🚨 Emergency Started:", reason);
  },

  // ✅ Stop Emergency
  stopEmergency: () =>
    set({
      emergencyActive: false,
      emergencyReason: null,
      emergencyStartedAt: null,
      lastVitals: null,
      lastLocation: null,
    }),

  // 🧠 Helpers
  isEmergency: () => get().emergencyActive,
  getEmergencyData: () => ({
    reason: get().emergencyReason,
    startedAt: get().emergencyStartedAt,
    vitals: get().lastVitals,
    location: get().lastLocation,
  }),
}));
