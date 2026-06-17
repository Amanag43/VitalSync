// src/services/healthConnect.js
// Reads vitals from Android Health Connect and syncs to your backend.
// Health Connect is Android-only (API 28+). On iOS or web this module no-ops gracefully.

import { Platform } from "react-native";

// ─── Health Connect is Android-only ──────────────────────────────────────────
// Install: npx expo install react-native-health-connect
// Docs: https://matinzd.github.io/react-native-health-connect/

let HC = null; // lazy-loaded so iOS doesn't crash on import

async function getHC() {
  if (HC) return HC;
  if (Platform.OS !== "android") return null;
  try {
    HC = await import("react-native-health-connect");
    return HC;
  } catch (e) {
    console.warn("[HealthConnect] Package not installed:", e.message);
    return null;
  }
}

// ─── Permissions we need ─────────────────────────────────────────────────────
const PERMISSIONS = [
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "OxygenSaturation" },
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "RespiratoryRate" },
  { accessType: "read", recordType: "BloodPressure" },
  { accessType: "read", recordType: "BodyTemperature" },
];

// ─── Initialize Health Connect ────────────────────────────────────────────────
export async function initHealthConnect() {
  const hc = await getHC();
  if (!hc) return { available: false, reason: "Not Android" };

  try {
    const { initialize, getSdkStatus, SdkAvailabilityStatus } = hc;
    const status = await getSdkStatus();

    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      return { available: false, reason: "Health Connect not installed on device" };
    }
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return { available: false, reason: "Health Connect needs update" };
    }
console.log("✅ Health Connect initialized");
    await initialize();
    return { available: true };
  } catch (e) {
    console.error("[HealthConnect] Init failed:", e);
    return { available: false, reason: e.message };
  }
}

// ─── Request permissions ──────────────────────────────────────────────────────
export async function requestHealthPermissions() {
  const hc = await getHC();
  if (!hc) return false;

  try {
    const { requestPermission } = hc;
    const granted = await requestPermission(PERMISSIONS);
    console.log("[HealthConnect] Permissions granted:", granted);
    return granted.length > 0;
  } catch (e) {
    console.error("[HealthConnect] Permission request failed:", e);
    return false;
  }
}

// ─── Read latest vitals (last N minutes) ─────────────────────────────────────
export async function readLatestVitals(minutesBack = 5) {
  const hc = await getHC();
  if (!hc) return null;

  const { readRecords } = hc;
  const now   = new Date();
  const start = new Date(now.getTime() - minutesBack * 60 * 1000);

  const timeFilter = {
    operator:  "between",
    startTime: start.toISOString(),
    endTime:   now.toISOString(),
  };

  const results = {};

  // Heart rate
  try {
    const { records } = await readRecords("HeartRate", { timeRangeFilter: timeFilter });
    if (records.length > 0) {
      const latest = records[records.length - 1];
      // HeartRate record has samples array
      const samples = latest.samples || [];
      const lastSample = samples[samples.length - 1];
      results.heartRate = {
        value:     lastSample?.beatsPerMinute ?? latest.beatsPerMinute,
        unit:      "bpm",
        timestamp: latest.time,
      };
    }
  } catch (e) { console.warn("[HealthConnect] HeartRate read:", e.message); }

  // SpO2 / Oxygen saturation
  try {
    const { records } = await readRecords("OxygenSaturation", { timeRangeFilter: timeFilter });
    if (records.length > 0) {
      const latest = records[records.length - 1];
      results.spo2 = {
        value:     Math.round(latest.percentage),
        unit:      "%",
        timestamp: latest.time,
      };
    }
  } catch (e) { console.warn("[HealthConnect] SpO2 read:", e.message); }

  // Steps (sum over the window)
  try {
    const { records } = await readRecords("Steps", { timeRangeFilter: timeFilter });
    const totalSteps = records.reduce((sum, r) => sum + (r.count || 0), 0);
    if (records.length > 0) {
      results.steps = {
        value:     totalSteps,
        unit:      "steps",
        timestamp: now.toISOString(),
      };
    }
  } catch (e) { console.warn("[HealthConnect] Steps read:", e.message); }

  // Respiratory rate
  try {
    const { records } = await readRecords("RespiratoryRate", { timeRangeFilter: timeFilter });
    if (records.length > 0) {
      const latest = records[records.length - 1];
      results.respiratoryRate = {
        value:     Math.round(latest.rate),
        unit:      "breaths/min",
        timestamp: latest.time,
      };
    }
  } catch (e) { console.warn("[HealthConnect] RespiratoryRate read:", e.message); }

  // Body temperature
  try {
    const { records } = await readRecords("BodyTemperature", { timeRangeFilter: timeFilter });
    if (records.length > 0) {
      const latest = records[records.length - 1];
      results.bodyTemp = {
        value:     latest.temperature?.inCelsius?.toFixed(1),
        unit:      "°C",
        timestamp: latest.time,
      };
    }
  } catch (e) { console.warn("[HealthConnect] BodyTemp read:", e.message); }

  // Blood pressure
  try {
    const { records } = await readRecords("BloodPressure", { timeRangeFilter: timeFilter });
    if (records.length > 0) {
      const latest = records[records.length - 1];
      results.bloodPressure = {
        systolic:  Math.round(latest.systolic?.inMillimetersOfMercury),
        diastolic: Math.round(latest.diastolic?.inMillimetersOfMercury),
        unit:      "mmHg",
        timestamp: latest.time,
      };
    }
  } catch (e) { console.warn("[HealthConnect] BloodPressure read:", e.message); }

  return Object.keys(results).length > 0 ? results : null;
}

// ─── Background polling ───────────────────────────────────────────────────────
// Call this once on app start; it fires a callback every `intervalMs`.
// The callback receives the latest vitals object.
let _pollingTimer = null;

export function startVitalsPolling(callback, intervalMs = 15000) {
  stopVitalsPolling();
  console.log(`[HealthConnect] Polling every ${intervalMs / 1000}s`);

  const poll = async () => {
    try {
      const vitals = await readLatestVitals(Math.ceil(intervalMs / 60000) + 1);
      if (vitals) callback(vitals);
    } catch (e) {
      console.warn("[HealthConnect] Poll error:", e.message);
    }
  };

  poll(); // immediate first read
  _pollingTimer = setInterval(poll, intervalMs);
  return _pollingTimer;
}

export function stopVitalsPolling() {
  if (_pollingTimer) {
    clearInterval(_pollingTimer);
    _pollingTimer = null;
  }
}