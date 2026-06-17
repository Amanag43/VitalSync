import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";
import { useVitalsStore } from "../src/store/vitalsStore";
import { startAlertEngine, stopAlertEngine } from "../src/engine/alertEngine";
import { initHealthConnect } from "../src/services/healthConnect";

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!isLoggedIn) return;

    const setup = async () => {
      try {
        console.log("STEP 1: getting userId");
        const userId = useAuthStore.getState().userId;
        console.log("STEP 2: userId =", userId);

        await initHealthConnect();
        console.log("STEP 3: health connect done");

        useVitalsStore.getState().setUserId(userId);
        useVitalsStore.getState().connectWebSocket(userId);
        console.log("STEP 4: websocket connecting");

        await startAlertEngine(userId);
        console.log("STEP 5: alert engine done");
      } catch (err) {
        console.log("SETUP ERROR:", err.message);
      }
    };

    setup();
    return () => stopAlertEngine();
  }, [isLoggedIn]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}