// src/store/vitalsStore.js
// Central vitals state using Zustand with emergency SOS integration

import { create } from "zustand";
import { router } from "expo-router";
import { sendSOSAlert } from "../services/emergencyservice";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BACKEND_URL = "http://192.168.29.170:5000"; // Replace with your  server IP

let _ws = null; // singleton WebSocket

// ─── THRESHOLDS (triggers alert if outside range) ─────────────────────────────
export const THRESHOLDS = {
  heartRate: { min: 45, max: 130, label: "Heart Rate", unit: "bpm" },
  spo2: { min: 92, max: 100, label: "SpO2", unit: "%" },
  respiratoryRate: {
    min: 10,
    max: 25,
    label: "Respiratory Rate",
    unit: "breaths/min",
  },
  bodyTemp: { min: 35.5, max: 38.5, label: "Body Temperature", unit: "°C" },
};

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────
export const useVitalsStore = create((set, get) => ({
  // State
  vitals: null, // latest { heartRate, spo2, steps, respiratoryRate, bodyTemp, bloodPressure }
  lastSync: null, // ISO timestamp of last successful POST
  syncing: false,
  activeAlert: null, // { vital, value, severity, patientName, timestamp }
  wsConnected: false,
  userId: null, // set after login

  // ── Actions ──────────────────────────────────────────────────────────

  setUserId: (id) => set({ userId: id }),

  // Called by vitals polling callback
  updateVitals: async (newVitals) => {
    set({ vitals: newVitals });

    const { userId } = get();
    if (!userId) {
      console.warn("[VitalsStore] No userId set");
      return;
    }

    // 1. Check thresholds locally for instant alert
    const alert = checkThresholds(newVitals);
    if (alert) {
      console.log(`[VitalsStore] ⚠️  THRESHOLD BREACHED: ${alert.vital}`);
      set({ activeAlert: alert });

      // Navigate to map with alert context
      router.push({
        pathname: "/(app)/map",
        params: { alertContext: JSON.stringify(alert) },
      });

      // Send SOS if CRITICAL
      if (alert.severity === "critical") {
        console.log("[VitalsStore] 🚨 CRITICAL - Sending SOS...");
        try {
          const result = await sendSOSAlert(userId, null, alert);
          console.log(
            `[VitalsStore] SOS result: ${result.sent} sent, ${result.failed} failed`
          );
        } catch (e) {
          console.warn("[VitalsStore] SOS send error:", e.message);
        }
      }
    } else {
      console.log("[VitalsStore] ✅ Vitals normal");
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
        deviceType: "phone_sensors",
      };

      console.log("[VitalsStore] Syncing to backend...");
      const res = await fetch(`${BACKEND_URL}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Backend ${res.status}`);

      set({ lastSync: new Date().toISOString(), syncing: false });
      console.log("[VitalsStore] ✅ Synced to backend");
    } catch (e) {
      console.warn("[VitalsStore] Sync failed:", e.message);
      set({ syncing: false });
    }
  },

  clearAlert: () => {
    console.log("[VitalsStore] Alert cleared");
    set({ activeAlert: null });
  },

  // ── WebSocket connection ──────────────────────────────────────────────────
  connectWebSocket: (userId) => {
    if (_ws?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected");
      return;
    }

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
        console.log("[WS] Message received:", msg.type);

        if (msg.type === "VITAL_ALERT") {
          console.log("[WS] Alert from backend:", msg.payload.vital);
          set({ activeAlert: msg.payload });
          router.push({
            pathname: "/(app)/map",
            params: { alertContext: JSON.stringify(msg.payload) },
          });
        }

        if (msg.type === "VITALS_UPDATE") {
          set({ vitals: msg.payload.vitals });
        }

        if (msg.type === "CONNECTED") {
          console.log("[WS] Connected to backend, userId:", msg.userId);
        }
      } catch (e) {
        console.warn("[WS] Parse error:", e.message);
      }
    };

    _ws.onclose = () => {
      console.log("[WS] Disconnected — retrying in 5s");
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
    if (_ws) {
      _ws.close();
      _ws = null;
    }
    set({ wsConnected: false });
    console.log("[WS] Disconnected");
  },
}));

// ─── LOCAL THRESHOLD CHECK ────────────────────────────────────────────────────
// Returns alert object if any vital is outside range, null if all normal
function checkThresholds(vitals) {
  if (!vitals) return null;

  for (const [key, rule] of Object.entries(THRESHOLDS)) {
    const reading = vitals[key];
    if (!reading) continue;

    const value = typeof reading === "object" ? reading.value : reading;
    const num = parseFloat(value);

    if (isNaN(num)) continue;

    // Check if value is outside range
    if (num < rule.min || num > rule.max) {
      // Determine severity based on how far outside range
      const percentBelowMin = rule.min - num;
      const percentAboveMax = num - rule.max;

      let severity = "warning";

      // Critical if significantly out of range
      if (percentBelowMin > rule.min * 0.15 || percentAboveMax > rule.max * 0.15) {
        severity = "critical";
      }

      console.log(
        `[Thresholds] ${rule.label}: ${num} (range: ${rule.min}-${rule.max}) → ${severity}`
      );

      return {
        vital: `${rule.label}: ${num} ${rule.unit}`,
        vitalKey: key,
        value: num,
        unit: rule.unit,
        severity,
        patientName: "Patient",
        timestamp: new Date().toISOString(),
      };
    }
  }

  return null;
}

// ─── Helper: Format vitals for display ─────────────────────────────────────────
export function formatVitals(vitals) {
  if (!vitals) return "No data";

  const parts = [];
  if (vitals.heartRate) parts.push(`HR: ${vitals.heartRate.value} bpm`);
  if (vitals.spo2) parts.push(`O2: ${vitals.spo2.value}%`);
  if (vitals.bodyTemp) parts.push(`Temp: ${vitals.bodyTemp.value}°C`);
  if (vitals.respiratoryRate)
    parts.push(`RR: ${vitals.respiratoryRate.value} /min`);

  return parts.join(" | ");
}

// ─── Helper: Get vital color based on threshold ────────────────────────────────
export function getVitalColor(key, value) {
  const rule = THRESHOLDS[key];
  if (!rule || value === undefined) return "#F0F4FF"; // default text color

  const num = parseFloat(value);
  if (num < rule.min || num > rule.max) {
    // Out of range
    const isWayOut =
      num < rule.min * 0.85 || num > rule.max * 1.15;
    return isWayOut ? "#FF3B5C" : "#FF9500"; // red for critical, orange for warning
  }

  return "#22C55E"; // green for normal
}