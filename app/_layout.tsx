import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { runHealthEngine } from "../src/engine/healthEngine";
import {
  initHealth,
  requestHealthPermissions,
} from "../src/services/healthService";
import { useAuthStore } from "../src/store/authStore";
import { useHealthStore } from "../src/store/healthStore";

import { sendVitals } from "../src/services/apiService";

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrated = useAuthStore((s) => s.hydrated);

useEffect(() => {
  if (!isLoggedIn) return;

  const setupHealth = async () => {
    try {
     console.log("Skipping health init");
      console.log("Health setup done");
    } catch (err) {
      console.log("Health setup error:", err.message);
    }
  };

  setupHealth();

  const interval = setInterval(() => {
    try {
      console.log("Engine tick");
    } catch (err) {
      console.log("Health Engine Error:", err.message);
    }
  }, 20000);

  return () => clearInterval(interval);
}, [isLoggedIn]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
