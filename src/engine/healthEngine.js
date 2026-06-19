// src/engine/healthEngine.js
// One-shot health data fetch + sync.
// Use this for manual refresh (e.g. pull-to-refresh on the vitals screen).
// For continuous background polling, use alertEngine.js instead.
//
// Previously this file imported from non-existent files:
//   ✗ "../services/healthService"  (does not exist)
//   ✗ "../store/healthStore"       (does not exist)
//
// Fixed to use the actual files in this project:
//   ✓ "../services/healthConnect"
//   ✓ "../store/vitalsStore"
//   ✓ "../store/authStore"

import { readLatestVitals } from "../services/healthConnect";
import { useAuthStore } from "../store/authStore";
import { useVitalsStore } from "../store/vitalsStore";

// ─── Manual one-shot fetch ────────────────────────────────────────────────────
// Returns the vitals object on success, or null on failure.
// All errors are caught so the UI never crashes.

export const runHealthEngine = async () => {
  try {
    // 1. Read from Health Connect (returns null if no data or not Android)
    let vitals = null;
    try {
      vitals = await readLatestVitals(30); // look back 30 min
    } catch (err) {
      console.warn("[HealthEngine] readLatestVitals error:", err.message);
      return null;
    }

    if (!vitals) {
      console.log("[HealthEngine] No vitals data in window");
      return null;
    }

    // 2. Get authenticated userId
    let userId = null;
    try {
      const authState = useAuthStore.getState();
      // Support both common auth store patterns
      userId = authState?.userId
        ?? authState?.user?.id
        ?? authState?.user?.uid
        ?? authState?.getUserId?.();
    } catch (err) {
      console.warn("[HealthEngine] Could not read userId:", err.message);
    }

    if (!userId) {
      console.log("[HealthEngine] No userId — skipping backend sync");
      return null;
    }

    // 3. Push into vitals store (triggers threshold check + backend sync)
    try {
      await useVitalsStore.getState().updateVitals(vitals);
    } catch (err) {
      console.warn("[HealthEngine] updateVitals error:", err.message);
    }

    return vitals;
  } catch (err) {
    // Top-level safety net — should never reach here
    console.warn("[HealthEngine] Unexpected error:", err.message);
    return null;
  }
};