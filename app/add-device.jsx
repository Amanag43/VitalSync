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

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

import { Ionicons } from "@expo/vector-icons";
import AppButton from "../src/components/AppButton";
import AppInput from "../src/components/AppInput";
import AppScreen from "../src/components/AppScreen";
import { theme } from "../src/theme/theme";

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
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return Alert.alert("Error", "User not logged in");

      if (!deviceName.trim() || !jacketId.trim()) {
        return Alert.alert("Error", "Device Name and Jacket ID are required");
      }

      setSaving(true);

      await addDoc(collection(db, "users", userId, "devices"), {
        deviceName: deviceName.trim(),
        jacketId: jacketId.trim(),
        age: age.trim(),
        weight: weight.trim(),
        height: height.trim(),
        bloodGroup: bloodGroup.trim(),
        allergies: allergies.trim(),
        createdAt: serverTimestamp(),
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
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Add Device</Text>
          <Text style={styles.subTitle}>Bind your Ninfet Jacket securely</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* ✅ CARD 1 */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardIcon}>
              <Ionicons name="watch" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Device Identity</Text>
          </View>

          <AppInput
            label="Device Name"
            placeholder="My Dad Jacket"
            value={deviceName}
            onChangeText={setDeviceName}
          />

          <AppInput
            label="Jacket ID"
            placeholder="JACKET123"
            value={jacketId}
            onChangeText={setJacketId}
            autoCapitalize="characters"
          />
        </View>

        {/* ✅ CARD 2 */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardIcon}>
              <Ionicons name="person" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>User Health Profile</Text>
          </View>

          <AppInput
            label="Age"
            placeholder="21"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          <AppInput
            label="Weight (kg)"
            placeholder="70"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />

          <AppInput
            label="Height (cm)"
            placeholder="175"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />

          <AppInput
            label="Blood Group"
            placeholder="O+ / A+ / B+"
            value={bloodGroup}
            onChangeText={setBloodGroup}
          />

          <AppInput
            label="Allergies"
            placeholder="None"
            value={allergies}
            onChangeText={setAllergies}
          />
        </View>

        {/* ✅ SAVE BUTTON */}
        <AppButton
          title={saving ? "Saving..." : "Save Device"}
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: 10 }}
        />

        {/* ✅ Small note */}
        <Text style={styles.note}>
          ✅ Tip: Use the same Jacket ID that hardware team has programmed.
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "900",
  },

  subTitle: {
    marginTop: 2,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },

  note: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
});
