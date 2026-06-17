// src/engine/alertEngine.js
// Bootstraps Health Connect polling and wires it to vitalsStore.
// Call startAlertEngine(userId) once after login.

import {
  initHealthConnect,
  requestHealthPermissions,
  startVitalsPolling,
  stopVitalsPolling,
} from "../services/healthConnect";
import { useVitalsStore } from "../store/vitalsStore";

let _engineRunning = false;

// ─── Start ────────────────────────────────────────────────────────────────────
export async function startAlertEngine(userId) {
  if (_engineRunning) return;

  console.log("[AlertEngine] Starting for user:", userId);

  // Set userId in store
  useVitalsStore.getState().setUserId(userId);

  // Connect WebSocket for server-push alerts
  useVitalsStore.getState().connectWebSocket(userId);

  // Init Health Connect (Android only)
  const { available, reason } = await initHealthConnect();

  if (!available) {
    console.warn("[AlertEngine] Health Connect unavailable:", reason);
    // Still run the engine for IoT jacket data via WebSocket
    _engineRunning = true;
    return { healthConnectAvailable: false, reason };
  }

  // Request permissions
  const granted = await requestHealthPermissions();
  if (!granted) {
    console.warn("[AlertEngine] Health Connect permissions denied");
    _engineRunning = true;
    return { healthConnectAvailable: false, reason: "Permissions denied" };
  }

  // Start polling — fires every 15 seconds
  startVitalsPolling((vitals) => {
    useVitalsStore.getState().updateVitals(vitals);
  }, 15000);

  _engineRunning = true;
  console.log("[AlertEngine] Running ✓");
  return { healthConnectAvailable: true };
}

// ─── Stop (call on logout) ────────────────────────────────────────────────────
export function stopAlertEngine() {
  stopVitalsPolling();
  useVitalsStore.getState().disconnectWebSocket();
  _engineRunning = false;
  console.log("[AlertEngine] Stopped");
}