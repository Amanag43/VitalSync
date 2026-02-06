import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useEmergencyStore } from "../store/emergencyStore";
import { useVitalsStore } from "../store/vitalsStore";

const BACKEND_URL = "http://192.168.1.9/iotjacket-api-php/api/v1";

export default function VitalsWatcher() {
  const setVitals = useVitalsStore((s) => s.setVitals);
  const startEmergency = useEmergencyStore((s) => s.startEmergency);

  const sosLock = useRef(false);
  const jacketId = "JKT001"; // later dynamic

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/vitals/latest.php?jacket_id=${jacketId}`,
        );
        const json = await res.json();
        if (!json.success) return;

        const v = json.data;
        setVitals(v);

        if (sosLock.current) return;

        if (v.spo2 < 88) fire("LOW_SPO2");
        else if (v.pulse > 140) fire("HIGH_PULSE");
        else if (v.temperature > 39) fire("HIGH_TEMP");
        else if (v.battery < 10) fire("LOW_BATTERY");
        else if (v.signal_strength < -95) fire("LOW_SIGNAL");
      } catch (e) {
        console.log("Vitals watcher error:", e.message);
      }
    }, 3000);

    const fire = (reason) => {
      sosLock.current = true;
      startEmergency(reason);
      Alert.alert("🚨 AUTO SOS", reason);
    };

    return () => clearInterval(interval);
  }, []);

  return null;
}
