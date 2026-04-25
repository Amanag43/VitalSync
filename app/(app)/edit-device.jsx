import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../src/components/AppButton";
import AppInput from "../../src/components/AppInput";
import AppScreen from "../../src/components/AppScreen";
import { theme } from "../../src/theme/theme";

import { getDevices, updateDevice } from "../../src/services/deviceService";

export default function EditDevice() {
  const { deviceId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deviceName, setDeviceName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [jacketId, setJacketId] = useState("");

  // ✅ FETCH DEVICE FROM MONGO BACKEND
  useEffect(() => {
    if (!deviceId) return;

    const fetchDevice = async () => {
      try {
        const devices = await getDevices();

        const d = devices.find((dev) => dev._id === deviceId);

        if (!d) {
          Alert.alert("Not Found", "Device not found");
          router.back();
          return;
        }

        setDeviceName(d.deviceName || "");
        setAge(String(d.age || ""));
        setWeight(String(d.weight || ""));
        setHeight(String(d.height || ""));
        setBloodGroup(d.bloodGroup || "");
        setAllergies(d.allergies || "");
        setJacketId(d.jacketId || "");
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId]);

  // ✅ UPDATE DEVICE
  const handleSave = async () => {
    if (!deviceName.trim() || !jacketId.trim()) {
      return Alert.alert("Error", "Device Name and Jacket ID are required");
    }

    try {
      setSaving(true);

      await updateDevice(deviceId, {
        deviceName,
        age,
        weight,
        height,
        bloodGroup,
        allergies,
        jacketId,
      });

      Alert.alert("✅ Updated", "Device updated successfully");
      router.back();
    } catch (err) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading device...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.title}>Edit Device</Text>

        <View style={{ width: 42 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Update Device Info</Text>
        <Text style={styles.sub}>
          Keep jacket details updated for accurate tracking & alerts.
        </Text>

        <AppInput
          label="Device Name"
          value={deviceName}
          onChangeText={setDeviceName}
        />

        <AppInput
          label="Jacket ID"
          value={jacketId}
          onChangeText={setJacketId}
        />

        <AppInput
          label="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <AppInput
          label="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <AppInput
          label="Height (cm)"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />

        <AppInput
          label="Blood Group"
          value={bloodGroup}
          onChangeText={setBloodGroup}
        />

        <AppInput
          label="Allergies"
          value={allergies}
          onChangeText={setAllergies}
        />

        <AppButton
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: 8 }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 10 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: "#111827",
    borderRadius: 12,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontWeight: "900",
  },

  card: {
    backgroundColor: "#020617",
    padding: 16,
    borderRadius: 16,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "900",
    marginBottom: 4,
  },
  sub: {
    color: "#94A3B8",
    marginBottom: 12,
  },
});