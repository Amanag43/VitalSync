import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import AppScreen from "../../src/components/AppScreen";
import { useAuthStore } from "../../src/store/authStore";
import { theme } from "../../src/theme/theme";

export default function SettingsScreen() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

const userId = useAuthStore.getState().getUserId();
  const shortUid = typeof userId === "number" ? userId.toString() : userId;

  // ✅ REAL LOGOUT (ONE SOURCE OF TRUTH)
  const handleLogout = () => {
    clearAuth();
    Alert.alert("✅ Logged out", "You have been logged out successfully");
  };

  return (
    <AppScreen>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subTitle}>Account & App preferences</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      {/* PROFILE */}
      <View style={styles.card}>
        <Text style={styles.profileTitle}>Logged In</Text>
        <Text style={styles.profileValue}>User ID: {shortUid}</Text>
      </View>

      {/* LOGOUT */}
      <Pressable
        style={styles.logoutBtn}
        onPress={() =>
          Alert.alert("Logout?", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: handleLogout },
          ])
        }
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
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
  profileTitle: {
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },
  profileValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: 6,
    backgroundColor: theme.colors.danger,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
});
