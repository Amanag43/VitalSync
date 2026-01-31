import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useEmergencyStore } from "../store/emergencyStore";

export default function EmergencyActionBar() {
  const emergencyActive = useEmergencyStore((s) => s.emergencyActive);
  const emergencyReason = useEmergencyStore((s) => s.emergencyReason);

  if (!emergencyActive) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="warning" size={18} color="#fff" />
        <Text style={styles.text}>
          Emergency Active • {emergencyReason || "Critical condition"}
        </Text>
      </View>

      <View style={styles.actions}>
        {/* Call Ambulance */}
        <Pressable
          style={[styles.btn, { backgroundColor: "#DC2626" }]}
          onPress={() => Linking.openURL("tel:108")}
        >
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.btnText}>Call 108</Text>
        </Pressable>

        {/* Open Map */}
        <Pressable
          style={[styles.btn, { backgroundColor: "#2563EB" }]}
          onPress={() => router.push("/map")}
        >
          <Ionicons name="map" size={16} color="#fff" />
          <Text style={styles.btnText}>Map</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#7F1D1D",
    padding: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 9999,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
});
