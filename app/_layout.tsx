import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";
import { startAlertEngine, stopAlertEngine } from "../src/engine/alertEngine";

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrated   = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;

    const setup = async () => {
      try {
        const userId = useAuthStore.getState().getUserId();
        console.log("[Layout] userId =", userId);

        if (!userId) {
          console.warn("[Layout] No userId after hydration — cannot start engine");
          return;
        }

        await startAlertEngine(userId);
        console.log("[Layout] Alert engine started ✅");
      } catch (err) {
        console.warn("[Layout] Setup error:", err.message);
      }
    };

    setup();
    return () => stopAlertEngine();
  }, [hydrated, isLoggedIn]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ← ADD THESE SCREENS */}
        <Stack.Screen name="(app)" />
        <Stack.Screen name="health-diagnostic" />
        {/* Add your other screens here as needed */}
      </Stack>
    </GestureHandlerRootView>
  );
}