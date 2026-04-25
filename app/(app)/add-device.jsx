import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../src/components/AppButton";
import AppInput from "../../src/components/AppInput";
import AppScreen from "../../src/components/AppScreen";
import { theme } from "../../src/theme/theme";

import { createDevice } from "../../src/services/deviceService";

export default function AddDevice() {
  const [deviceName, setDeviceName] = useState("");
  const [jacketId, setJacketId] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!deviceName.trim() || !jacketId.trim()) {
      Alert.alert("Error", "Device Name and Jacket ID are required");
      return;
    }

    try {
      setSaving(true);

      await createDevice({
        deviceName: deviceName.trim(),
        jacketId: jacketId.trim(),
        age,
        weight,
        height,
        bloodGroup,
        allergies,
      });

      Alert.alert("✅ Added", "Device added successfully!");
      router.back();
    } catch (err) {
      Alert.alert("Failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Add Device</Text>
          <Text style={styles.subTitle}>Bind your Device securely</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="watch" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Device Identity</Text>
          </View>

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
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="person" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>User Health Profile</Text>
          </View>

          <AppInput label="Age" value={age} onChangeText={setAge} />
          <AppInput label="Weight" value={weight} onChangeText={setWeight} />
          <AppInput label="Height" value={height} onChangeText={setHeight} />
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
        </View>

        <AppButton
          title={saving ? "Saving..." : "Save Device"}
          onPress={handleSave}
          disabled={saving}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
    color: "#fff",
    fontWeight: "900",
  },
  subTitle: {
    color: "#94A3B8",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#020617",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "900",
  },
});