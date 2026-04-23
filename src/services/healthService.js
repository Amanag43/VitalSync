import {
    initialize,
    readRecords,
    requestPermission,
} from "react-native-health-connect";

export const initHealth = async () => {
  try {
    await initialize();
    console.log("Health Connect Initialized");
  } catch (err) {
    console.log("Health init error:", err);
  }
};

export const requestHealthPermissions = async () => {
  try {
    await requestPermission([
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "OxygenSaturation" },
      { accessType: "read", recordType: "BodyTemperature" },
    ]);
  } catch (err) {
    console.log("Permission error:", err);
  }
};

export const getVitals = async () => {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 5 * 60 * 1000);

    const heartRate = await readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: start.toISOString(),
        endTime: now.toISOString(),
      },
    });

    const spo2 = await readRecords("OxygenSaturation", {
      timeRangeFilter: {
        operator: "between",
        startTime: start.toISOString(),
        endTime: now.toISOString(),
      },
    });

    return {
      heartRate: heartRate.records[0]?.beatsPerMinute || null,
      spo2: spo2.records[0]?.percentage || null,
    };
  } catch (err) {
    console.log("Fetch vitals error:", err);
    return {};
  }
};
