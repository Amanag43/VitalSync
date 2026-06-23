// src/components/AlertBanner.jsx
// Shows red SOS banner at top when vitals are abnormal
// Tappable to go to map + hospitals

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";
import { useVitalsStore } from "../store/vitalsStore";

const C = {
  bg: "#0A0E17",
  red: "#FF3B5C",
  redDark: "#8B1F2E",
  text: "#F0F4FF",
  muted: "#6B7B9A",
};

export default function AlertBanner() {
  const activeAlert = useVitalsStore((s) => s.activeAlert);
  const clearAlert = useVitalsStore((s) => s.clearAlert);

  if (!activeAlert) return null;

  const isCritical = activeAlert.severity === "critical";
  const bgColor = isCritical ? C.red : "#FF9500"; // Red for critical, orange for warning

  const handleOpenMap = () => {
    router.push({
      pathname: "/(app)/map",
      params: { alertContext: JSON.stringify(activeAlert) },
    });
  };

  return (
    <TouchableOpacity
      onPress={handleOpenMap}
      activeOpacity={0.8}
      style={[s.container, { backgroundColor: bgColor }]}
    >
      <View style={s.content}>
        <Text style={s.sos}>
          {isCritical ? "🚨 CRITICAL ALERT" : "⚠️ WARNING"}
        </Text>
        <Text style={s.vital}>{activeAlert.vital}</Text>
        <Text style={s.hint}>Tap to view hospitals & get help →</Text>
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          clearAlert();
        }}
        style={s.closeBtn}
      >
        <Text style={s.closeText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: C.redDark,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  sos: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  vital: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  hint: {
    color: C.text,
    fontSize: 11,
    opacity: 0.9,
    fontStyle: "italic",
  },
  closeBtn: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
  },
});