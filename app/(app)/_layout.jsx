// app/(app)/_layout.jsx
// APP LAYOUT — FIXED

import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="map" />
      <Stack.Screen name="health-diagnostic" />
      <Stack.Screen name="emergency-contacts" />
      {/* Add your other screens here */}
    </Stack>
  );
}