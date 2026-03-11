import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { runHealthEngine } from "../src/engine/healthEngine";
import {
  getVitals,
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
setInterval(() => {
    runHealthEngine();
  }, 20000);
    const setupHealth = async () => {
      await initHealth();
      await requestHealthPermissions();
    };

    setupHealth();

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="(app)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}
