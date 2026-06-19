// src/services/googleFit.js

import GoogleFit, { Scopes } from 'react-native-google-fit';

export async function initGoogleFit() {
  try {
    const result = await GoogleFit.startAuthorization({ scopes: [Scopes.HEART_RATE, Scopes.STEPS] });
    console.log("[GoogleFit] Authorized:", result);
    return { available: true };
  } catch (e) {
    console.error("[GoogleFit] Auth failed:", e.message);
    return { available: false, reason: e.message };
  }
}

export async function readLatestVitals(minutesBack = 5) {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - minutesBack * 60 * 1000);

    // Heart rate from last 5 minutes
    const heartRateData = await GoogleFit.getHeartRateSamples({
      startDate: start.getTime(),
      endDate: now.getTime(),
      ascending: false,
      limit: 1,
    });

    // Steps from last 5 minutes
    const stepsData = await GoogleFit.getDailyStepCountSamples({
      startDate: start.getTime(),
      endDate: now.getTime(),
    });

    const vitals = {};

    if (heartRateData.length > 0) {
      vitals.heartRate = {
        value: Math.round(heartRateData[0].value),
        unit: "bpm",
        timestamp: new Date(heartRateData[0].startDate).toISOString(),
      };
    }

    if (stepsData.length > 0) {
      vitals.steps = {
        value: stepsData[0].steps,
        unit: "steps",
        timestamp: now.toISOString(),
      };
    }

    return Object.keys(vitals).length > 0 ? vitals : null;
  } catch (e) {
    console.error("[GoogleFit] Read failed:", e.message);
    return null;
  }
}