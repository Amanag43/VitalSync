// src/engine/alertEngine.js
// CORRECT VERSION - Works with your existing architecture

import { useVitalsStore } from "../store/vitalsStore";

let _engineRunning = false;
let _pollingInterval = null;

export async function startAlertEngine(userId) {
  if (_engineRunning) {
    console.log("[AlertEngine] Already running");
    return;
  }

  console.log("[AlertEngine] Starting for user:", userId);

  // Set userId in store
  useVitalsStore.getState().setUserId(userId);

  // Connect WebSocket for backend alerts
  useVitalsStore.getState().connectWebSocket(userId);

  // Poll every 15 seconds
  const poll = async () => {
    try {
      // Generate mock vitals (realistic randomized data)
      const vitals = {
        heartRate: {
          value: 70 + Math.floor(Math.random() * 15),
          unit: "bpm",
          timestamp: new Date().toISOString(),
        },
        spo2: {
          value: 95 + Math.floor(Math.random() * 5),
          unit: "%",
          timestamp: new Date().toISOString(),
        },
        respiratoryRate: {
          value: 14 + Math.floor(Math.random() * 4),
          unit: "breaths/min",
          timestamp: new Date().toISOString(),
        },
        bodyTemp: {
          value: "36.8",
          unit: "°C",
          timestamp: new Date().toISOString(),
        },
        steps: {
          value: 1000 + Math.floor(Math.random() * 500),
          unit: "steps",
          timestamp: new Date().toISOString(),
        },
      };

      // This triggers: threshold check → alert → SOS → map navigation
      // All handled by vitalsStore
      useVitalsStore.getState().updateVitals(vitals);

    } catch (err) {
      console.error("[AlertEngine] Poll error:", err.message);
    }
  };

  // First poll immediately
  await poll();

  // Then poll every 15 seconds
  _pollingInterval = setInterval(poll, 15000);

  _engineRunning = true;
  console.log("[AlertEngine] ✅ Mock vitals polling active every 15s");

  return { available: true };
}

export function stopAlertEngine() {
  if (_pollingInterval) {
    clearInterval(_pollingInterval);
    _pollingInterval = null;
  }

  useVitalsStore.getState().disconnectWebSocket();
  _engineRunning = false;

  console.log("[AlertEngine] Stopped");
}