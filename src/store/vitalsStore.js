// src/store/vitalsStore.js
// Central vitals state using Zustand.
// Handles: local state, backend POST, WebSocket for incoming push alerts,
//          threshold checking and alert navigation.
//
// POLLING LIVES HERE — alertEngine starts/stops it.
// Do NOT also call startVitalsPolling from healthConnect.js — that function
// no longer exists. This store owns the interval.
//
// Install: npx expo install zustand

import { create } from "zustand";
import { router } from "expo-router";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// For physical Android device on same WiFi as your dev PC, use your PC's LAN IP.
// For emulator: http://10.0.2.2:5000
const BACKEND_URL = "http://192.168.29.170:5000";

let _ws = null; // singleton WebSocket

// ─── THRESHOLDS ───────────────────────────────────────────────────────────────
// Triggers alert when a reading is outside [min, max].
// "critical" = more than 15 % outside the boundary.
// bloodPressure is checked separately below (two values).

export const THRESHOLDS = {
  heartRate: {
    min: 45, max: 130,
    label: "Heart Rate", unit: "bpm",
  },
  spo2: {
    min: 92, max: 100,
    label: "SpO2", unit: "%",
  },
  respiratoryRate: {
    min: 10, max: 25,
    label: "Respiratory Rate", unit: "breaths/min",
  },
  bodyTemp: {
    min: 35.5, max: 38.5,
    label: "Body Temperature", unit: "°C",
  },
};

// Blood pressure checked separately (object with systolic + diastolic)
const BP_THRESHOLDS = {
  systolic:  { min: 80, max: 180 },
  diastolic: { min: 50, max: 110 },
};

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────
export const useVitalsStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  vitals:          null,   // latest vitals object from Health Connect
  lastSync:        null,   // ISO timestamp of last successful backend POST
  syncing:         false,
  activeAlert:     null,   // { vital, value, severity, timestamp } | null
  wsConnected:     false,
  userId:          null,
  _pollingInterval: null,  // internal — do not read directly

  // ── Actions ────────────────────────────────────────────────────────────────

  setUserId: (id) => set({ userId: id }),

  // Called by alertEngine after login
  startPolling: (intervalMs = 20000) => {
    // Guard: don't start a second interval if already running
    const existing = get()._pollingInterval;
    if (existing) return;

    console.log(`[VitalsStore] Starting polling every ${intervalMs / 1000}s`);

    const poll = async () => {
      try {
        // Dynamic import keeps iOS from crashing (healthConnect is Android-only)
        const { readLatestVitals } = await import("../services/healthConnect");
        const vitals = await readLatestVitals(30); // look back 30 min
        if (vitals) {
          await get().updateVitals(vitals);
        } else {
          console.log("[VitalsStore] No new vitals in window");
        }
      } catch (e) {
        console.warn("[VitalsStore] Poll error:", e.message);
      }
    };

    poll(); // immediate first read
    const id = setInterval(poll, intervalMs);
    set({ _pollingInterval: id });
  },

  // Called by alertEngine on logout
  stopPolling: () => {
    const id = get()._pollingInterval;
    if (id) {
      clearInterval(id);
      set({ _pollingInterval: null });
      console.log("[VitalsStore] Polling stopped");
    }
  },

  // Main update — called by polling, or can be called manually for testing
  updateVitals: async (newVitals) => {
    set({ vitals: newVitals });

    const { userId } = get();

    // 1. Check thresholds → maybe navigate to map
    const alert = checkThresholds(newVitals);
    if (alert) {
      set({ activeAlert: alert });
      console.warn("[VitalsStore] 🚨 Alert:", alert.vital, alert.severity);
      router.push({
        pathname: "/(app)/map",
        params: { alertContext: JSON.stringify(alert) },
      });
    }

    // 2. Sync to backend (fire-and-forget, don't block UI)
    if (userId) {
      get().syncToBackend(newVitals, userId, alert?.severity ?? "normal");
    }
  },

  syncToBackend: async (vitals, userId, severity = "normal") => {
    set({ syncing: true });
    try {
      const payload = {
        userId,
        timestamp:  new Date().toISOString(),
        vitals,
        severity,
        deviceType: "health_connect", // ← correct: no jacket, pure HC
      };

      const res = await fetch(`${BACKEND_URL}/vitals`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Backend responded ${res.status}`);

      set({ lastSync: new Date().toISOString(), syncing: false });
      console.log("[VitalsStore] ✅ Synced to backend");
    } catch (e) {
      console.warn("[VitalsStore] Sync failed:", e.message);
      set({ syncing: false });
    }
  },

  clearAlert: () => set({ activeAlert: null }),

  // ── WebSocket ──────────────────────────────────────────────────────────────
  // Optional: lets your backend push alerts to the app (e.g. from a second device)
  connectWebSocket: (userId) => {
    if (_ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${BACKEND_URL.replace("http", "ws")}/ws?userId=${userId}`;
    console.log("[WS] Connecting:", wsUrl);
    _ws = new WebSocket(wsUrl);

    _ws.onopen = () => {
      console.log("[WS] Connected");
      set({ wsConnected: true });
    };

    _ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "VITAL_ALERT") {
          set({ activeAlert: msg.payload });
          router.push({
            pathname: "/(app)/map",
            params: { alertContext: JSON.stringify(msg.payload) },
          });
        }

        if (msg.type === "VITALS_UPDATE") {
          set({ vitals: msg.payload.vitals });
        }
      } catch (e) {
        console.warn("[WS] Parse error:", e.message);
      }
    };

    _ws.onclose = () => {
      console.log("[WS] Disconnected — retrying in 5s");
      set({ wsConnected: false });
      setTimeout(() => {
        const { userId: uid } = get();
        if (uid) get().connectWebSocket(uid);
      }, 5000);
    };

    _ws.onerror = (e) => {
      console.warn("[WS] Error:", e.message);
    };
  },

  disconnectWebSocket: () => {
    _ws?.close();
    _ws = null;
    set({ wsConnected: false });
  },
}));

// ─── THRESHOLD CHECKER ────────────────────────────────────────────────────────
// Returns an alert object if any vital is out of range, else null.

function checkThresholds(vitals) {
  if (!vitals) return null;

  // Check scalar vitals (heartRate, spo2, respiratoryRate, bodyTemp)
  for (const [key, rule] of Object.entries(THRESHOLDS)) {
    const reading = vitals[key];
    if (!reading) continue;

    // Each reading is { value, unit, timestamp }
    const num = parseFloat(reading.value);
    if (isNaN(num)) continue;

    if (num < rule.min || num > rule.max) {
      const severity =
        num < rule.min * 0.85 || num > rule.max * 1.15 ? "critical" : "warning";

      return {
        vital:     `${rule.label}: ${num} ${rule.unit}`,
        vitalKey:  key,
        value:     num,
        unit:      rule.unit,
        severity,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check blood pressure separately (different structure: { systolic, diastolic, unit, timestamp })
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;

    const sysNum = parseFloat(systolic);
    const diaNum = parseFloat(diastolic);

    if (!isNaN(sysNum)) {
      const { min, max } = BP_THRESHOLDS.systolic;
      if (sysNum < min || sysNum > max) {
        return {
          vital:     `Blood Pressure (systolic): ${sysNum} mmHg`,
          vitalKey:  "bloodPressure",
          value:     sysNum,
          unit:      "mmHg",
          severity:  sysNum < min * 0.85 || sysNum > max * 1.15 ? "critical" : "warning",
          timestamp: new Date().toISOString(),
        };
      }
    }

    if (!isNaN(diaNum)) {
      const { min, max } = BP_THRESHOLDS.diastolic;
      if (diaNum < min || diaNum > max) {
        return {
          vital:     `Blood Pressure (diastolic): ${diaNum} mmHg`,
          vitalKey:  "bloodPressure",
          value:     diaNum,
          unit:      "mmHg",
          severity:  diaNum < min * 0.85 || diaNum > max * 1.15 ? "critical" : "warning",
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  return null;
}