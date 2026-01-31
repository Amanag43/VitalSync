import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useEmergencyStore } from "../store/emergencyStore";
import { useVitalsStore } from "../store/vitalsStore";

const BACKEND_URL = "http://192.168.1.9/iotjacket-api-php/api/v1";

export default function VitalsWatcher() {
  const setVitals = useVitalsStore((s) => s.setVitals);
  const startEmergency = useEmergencyStore((s) => s.startEmergency);

  const sosLock = useRef(false);
  const lastSeenRef = useRef(Date.now());
  const jacketId = "JKT001"; // TODO: make dynamic later

  useEffect(() => {
    // 🔔 FIRE SOS (single place)
    const fire = (reason) => {
      sosLock.current = true;
      startEmergency(reason);
      Alert.alert("🚨 AUTO SOS", reason);
    };

    // 🔁 FETCH VITALS
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/vitals/latest.php?jacket_id=${jacketId}`,
        );
        const json = await res.json();
        if (!json.success) return;

        const v = json.data;
        setVitals(v);
        lastSeenRef.current = Date.now();

        // 🚨 AUTO SOS RULES
        if (!sosLock.current) {
          if (v.spo2 !== null && v.spo2 < 88) fire("LOW_SPO2");
          else if (v.pulse !== null && v.pulse > 140) fire("HIGH_PULSE");
          else if (v.temperature !== null && v.temperature > 39)
            fire("HIGH_TEMP");
          else if (v.battery !== null && v.battery < 10) fire("LOW_BATTERY");
          else if (v.signal_strength !== null && v.signal_strength < -95)
            fire("LOW_SIGNAL");
        }
      } catch (e) {
        console.log("VitalsWatcher error:", e.message);
      }
    }, 2000);

    // 🔌 OFFLINE DETECTOR
    const offlineInterval = setInterval(() => {
      const diff = Date.now() - lastSeenRef.current;
      if (diff > 10000 && !sosLock.current) {
        fire("DEVICE_OFFLINE");
      }
    }, 5000);

    // 🧹 CLEANUP (VERY IMPORTANT)
    return () => {
      clearInterval(interval);
      clearInterval(offlineInterval);
    };
  }, []);

  return null; // ✅ MUST RETURN NULL
}
