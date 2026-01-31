import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { auth } from "../firebaseConfig";
import EmergencyActionBar from "../src/components/EmergencyActionBar";
import VitalsWatcher from "../src/providers/VitalsWatcher";
import { useEmergencyStore } from "../src/store/emergencyStore";
export default function RootLayout() {
  const router = useRouter();
  const emergencyActive = useEmergencyStore((s) => s.emergencyActive);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCheckingAuth(false);
      router.replace(user ? "/(app)/home" : "/(auth)/login");
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (emergencyActive) {
      router.push("/map");
    }
  }, [emergencyActive]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* ✅ MUST be self-closing */}
      <VitalsWatcher />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="loading" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="add-device" />
        <Stack.Screen name="device-details" />
        <Stack.Screen name="edit-device" />
        <Stack.Screen name="map" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="contacts" />
        <Stack.Screen name="settings" />
      </Stack>
      <EmergencyActionBar />
    </GestureHandlerRootView>
  );
}
