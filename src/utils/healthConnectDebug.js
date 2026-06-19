// src/utils/healthConnectDebug.js
// Paste a call to debugHealthConnect() in any screen temporarily.
// It logs every step so you know exactly where it fails.

import { Platform, Linking } from "react-native";

export async function debugHealthConnect() {
  console.log("=== HEALTH CONNECT DEBUG START ===");
  console.log("Platform:", Platform.OS);
  console.log("Platform Version:", Platform.Version); // must be >= 26

  if (Platform.OS !== "android") {
    console.log("❌ Not Android — Health Connect is Android only");
    return;
  }

  // Step 1: Can we import the package at all?
  let hc;
  try {
    hc = require("react-native-health-connect");
    console.log("✅ Package imported. Keys:", Object.keys(hc).join(", "));
  } catch (e) {
    console.log("❌ IMPORT FAILED:", e.message);
    console.log("→ Fix: npx expo install react-native-health-connect then rebuild");
    return;
  }

  // Step 2: What is the SDK status?
  try {
    const { getSdkStatus, SdkAvailabilityStatus } = hc;
    const status = await getSdkStatus();
    console.log("SDK status code:", status);

    const statusMap = {
      [SdkAvailabilityStatus.SDK_AVAILABLE]: "✅ SDK_AVAILABLE",
      [SdkAvailabilityStatus.SDK_UNAVAILABLE]: "❌ SDK_UNAVAILABLE — Health Connect app not installed",
      [SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED]: "⚠️ SDK needs update",
    };
    console.log("SDK status:", statusMap[status] ?? `Unknown status: ${status}`);

    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      console.log("→ Fix: Install Health Connect from Play Store");
      // Open Play Store to Health Connect
      Linking.openURL(
        "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"
      );
      return;
    }
  } catch (e) {
    console.log("❌ getSdkStatus FAILED:", e.message);
    return;
  }

  // Step 3: Initialize
  try {
    const { initialize } = hc;
    const result = await initialize();
    console.log("initialize() result:", result);
  } catch (e) {
    console.log("❌ initialize() FAILED:", e.message);
    return;
  }

  // Step 4: Check what permissions are already granted
  try {
    const { getGrantedPermissions } = hc;
    const granted = await getGrantedPermissions();
    console.log("Already granted permissions:", JSON.stringify(granted, null, 2));
  } catch (e) {
    console.log("⚠️ getGrantedPermissions failed (may not exist in your version):", e.message);
  }

  // Step 5: Request permissions and see raw result
  try {
    const { requestPermission } = hc;
    console.log("Calling requestPermission now — dialog should appear...");

    const result = await requestPermission([
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "OxygenSaturation" },
    ]);

    console.log("requestPermission raw result:", JSON.stringify(result));
    console.log("Granted count:", result?.length ?? 0);

    if (!result || result.length === 0) {
      console.log("❌ 0 permissions granted");
      console.log("Possible reasons:");
      console.log("  1. MainActivity.kt is missing HealthConnectPermissionDelegate");
      console.log("  2. App not rebuilt after adding delegate");
      console.log("  3. Health Connect app needs update");
      console.log("  4. Running in Expo Go instead of dev build");
    } else {
      console.log("✅ Permissions granted:", result.map((p) => p.recordType).join(", "));
    }
  } catch (e) {
    console.log("❌ requestPermission FAILED:", e.message);
    console.log("Stack:", e.stack);
  }

  // Step 6: Try reading data regardless
  try {
    const { readRecords } = hc;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const result = await readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: weekAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });

    console.log("HeartRate records in last 7 days:", result?.records?.length ?? 0);
    if (result?.records?.length > 0) {
      const last = result.records[result.records.length - 1];
      console.log("Latest reading:", JSON.stringify(last));
    } else {
      console.log("→ No heart rate data — make sure Samsung Health / Google Fit is syncing to Health Connect");
    }
  } catch (e) {
    console.log("❌ readRecords FAILED:", e.message);
  }

  console.log("=== HEALTH CONNECT DEBUG END ===");
}