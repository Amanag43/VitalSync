// src/store/vitalsStore.js
// Central vitals state using Zustand.
// Handles: local state, backend POST, WebSocket for incoming push alerts.
//
// Install: npx expo install zustand

import { create } from "zustand";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BACKEND_URL = "http://192.168.29.170:5000"; // ← replace with your server IP
// For local dev on a physical Android device, use your PC's LAN IP e.g. 192.168.1.x
// For emulator use: http://10.0.2.2:5000

let _ws = null; // singleton WebSocket

// ─── THRESHOLDS (triggers alert if outside range) ─────────────────────────────
export const THRESHOLDS = {
  heartRate:      { min: 45,  max: 130, label: "Heart Rate",     unit: "bpm"         },
  spo2:           { min: 92,  max: 100, label: "SpO2",           unit: "%"           },
  respiratoryRate:{ min: 10,  max: 25,  label: "Respiratory Rate",unit: "breaths/min" },
  bodyTemp:       { min: 35.5,max: 38.5,label: "Body Temperature",unit: "°C"         },
};

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────
export const useVitalsStore = create((set, get) => ({
  // State
  vitals:          null,   // latest { heartRate, spo2, steps, respiratoryRate, bodyTemp, bloodPressure }
  lastSync:        null,   // ISO timestamp of last successful POST
  syncing:         false,
  activeAlert:     null,   // { vital, value, severity, patientName }
  wsConnected:     false,
  userId:          null,   // set after login

  startPolling: () => {
    const INTERVAL_MS = 20000; // poll every 20 seconds

    const poll = async () => {
      try {
        const { readLatestVitals } = await import("../services/healthConnect");
        const vitals = await readLatestVitals();
        if (vitals) await get().updateVitals(vitals);
      } catch (e) {
        console.warn("[VitalsStore] Poll error:", e.message);
      }
    };

    poll(); // run immediately
    const intervalId = setInterval(poll, INTERVAL_MS);

    // Store interval so it can be cleared later
    set({ _pollingInterval: intervalId });
  },

  stopPolling: () => {
    const { _pollingInterval } = get();
    if (_pollingInterval) clearInterval(_pollingInterval);
    set({ _pollingInterval: null });
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  setUserId: (id) => set({ userId: id }),

  // Called by healthConnect polling callback
  updateVitals: async (newVitals) => {
    set({ vitals: newVitals });

    const { userId } = get();
    if (!userId) return;

    // 1. Check thresholds locally for instant alert
    const alert = checkThresholds(newVitals);
    if (alert) {
      set({ activeAlert: alert });
      // Navigate to map with alert context
      router.push({
        pathname: "/(app)/map",
        params: { alertContext: JSON.stringify(alert) },
      });
    }

    // 2. Sync to backend
    await get().syncToBackend(newVitals, userId, alert?.severity ?? "normal");
  },

  syncToBackend: async (vitals, userId, severity = "normal") => {
    set({ syncing: true });
    try {
      const payload = {
        userId,
        timestamp: new Date().toISOString(),
        vitals,
        severity,
        deviceType: "iot_jacket",
      };

      const res = await fetch(`${BACKEND_URL}/vitals`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Backend ${res.status}`);

      set({ lastSync: new Date().toISOString(), syncing: false });
      console.log("[VitalsStore] Synced to backend ✓");
    } catch (e) {
      console.warn("[VitalsStore] Sync failed:", e.message);
      set({ syncing: false });
    }
  },

  clearAlert: () => set({ activeAlert: null }),

  // ── WebSocket connection ──────────────────────────────────────────────────
  connectWebSocket: (userId) => {
    if (_ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = BACKEND_URL.replace("http", "ws") + `/ws?userId=${userId}`;
    console.log("[WS] Connecting:", wsUrl);

    _ws = new WebSocket(wsUrl);

    _ws.onopen = () => {
      console.log("[WS] Connected");
      set({ wsConnected: true });
    };

    _ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("[WS] Message:", msg.type);

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
      console.log("[WS] Disconnected");
      set({ wsConnected: false });
      // Reconnect after 5s
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

// ─── LOCAL THRESHOLD CHECK ────────────────────────────────────────────────────
function checkThresholds(vitals) {
  for (const [key, rule] of Object.entries(THRESHOLDS)) {
    const reading = vitals[key];
    if (!reading) continue;

    const value = typeof reading === "object" ? reading.value : reading;
    const num   = parseFloat(value);

    if (isNaN(num)) continue;

    if (num < rule.min || num > rule.max) {
      const severity = num < rule.min * 0.85 || num > rule.max * 1.15
        ? "critical"
        : "warning";

      return {
        vital:       `${rule.label}: ${num} ${rule.unit}`,
        vitalKey:    key,
        value:       num,
        unit:        rule.unit,
        severity,
        patientName: "Patient",    // override with real name from auth store
        timestamp:   new Date().toISOString(),
      };
    }
  }
  return null;
}