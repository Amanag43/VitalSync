import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

import { Ionicons } from "@expo/vector-icons";
import AppScreen from "../../src/components/AppScreen";
import BMICard from "../../src/components/BMICard";
import EmergencyBanner from "../../src/components/EmergencyBanner";
import FAB from "../../src/components/FAB";
import PrimaryAidCard from "../../src/components/PrimaryAidCard";
import StatusPill from "../../src/components/StatusPill";
import { useEmergencyStore } from "../../src/store/emergencyStore";
import { useVitalsStore } from "../../src/store/vitalsStore";
import { theme } from "../../src/theme/theme";

export default function Home() {
  const emergencyActive = useEmergencyStore((s) => s.emergencyActive);
  const emergencyReason = useEmergencyStore((s) => s.emergencyReason);
  const stopEmergency = useEmergencyStore((s) => s.stopEmergency);
  const { vitals } = useVitalsStore();
  const [devices, setDevices] = useState([]);
  const [sosActiveCount, setSosActiveCount] = useState(0); // optional UI indicator

  const userEmail = auth.currentUser?.email || "User";

  // ✅ Fetch Devices (realtime)
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const ref = collection(db, "users", userId, "devices");

    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setDevices(list);

      // Optional: you can link SOS status later
      setSosActiveCount(0);
    });

    return () => unsub();
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("✅ Logged out", "You have been logged out successfully");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ✅ Delete Device
  const handleDeleteDevice = async (deviceId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await deleteDoc(doc(db, "users", userId, "devices", deviceId));
    } catch (err) {
      Alert.alert("Delete Failed", err.message);
    }
  };

  // ✅ Fake status generator (premium feel)
  // Later we will connect to real "last seen time" from backend.
  const getDeviceStatus = (device) => {
    // For now -> Always online (you can change later)
    return "online"; // online | offline | sos
  };

  const devicesCount = useMemo(() => devices.length, [devices]);

  return (
    <View style={{ flex: 1 }}>
      <AppScreen>
        {/* ✅ TOP HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hiText}>Dashboard</Text>
            <Text style={styles.subText} numberOfLines={1}>
              Logged in as: {userEmail}
            </Text>
          </View>
          {/* ✅ EMERGENCY ACTIVE CARD */}
          {emergencyActive && (
            <View
              style={{
                backgroundColor: "#DC2626",
                padding: 16,
                borderRadius: 18,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Ionicons name="warning" size={22} color="#fff" />
                <Text
                  style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}
                >
                  Emergency Active
                </Text>
              </View>

              <Text
                style={{
                  marginTop: 6,
                  color: "#FFE4E6",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {emergencyReason || "Critical vitals detected"}
              </Text>

              <Pressable
                onPress={stopEmergency}
                style={{
                  marginTop: 10,
                  alignSelf: "flex-start",
                  backgroundColor: "#fff",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontWeight: "900", color: "#111" }}>
                  Dismiss
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => router.push("/settings")}
            style={styles.iconBtn}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
        {/* ✅ EMERGENCY BANNER */}
        <EmergencyBanner
          onOpenMap={() => {
            if (devices.length === 0) {
              Alert.alert("No Device", "Add a device first");
              return;
            }

            // ✅ open map using first device jacketId
            router.push({
              pathname: "/map",
              params: { jacketId: devices[0].jacketId },
            });
          }}
        />
        <PrimaryAidCard />

        {/* ✅ SUMMARY CARDS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Devices</Text>
            <Text style={styles.statValue}>{devicesCount}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SOS Alerts</Text>
            <Text style={[styles.statValue, { color: theme.colors.danger }]}>
              {sosActiveCount}
            </Text>
          </View>
        </View>

        {emergencyActive && emergencyReason === "LOW_SIGNAL" && (
          <Text style={{ color: "#F59E0B", fontWeight: "800", marginTop: 6 }}>
            ⚠️ Weak signal detected
          </Text>
        )}

        {emergencyActive && emergencyReason === "DEVICE_OFFLINE" && (
          <Text style={{ color: "#DC2626", fontWeight: "900", marginTop: 6 }}>
            🚫 Device offline
          </Text>
        )}

        {/* ✅ QUICK ACTIONS */}
        <View style={styles.quickRow}>
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push("/alerts")}
          >
            <View
              style={[
                styles.quickIcon,
                { backgroundColor: theme.colors.dangerSoft },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={theme.colors.danger}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTitle}>Alerts</Text>
              <Text style={styles.quickSub}>SOS history & vitals</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.muted}
            />
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push("/contacts")}
          >
            <View
              style={[
                styles.quickIcon,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <Ionicons name="call" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTitle}>Contacts</Text>
              <Text style={styles.quickSub}>Emergency numbers</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.muted}
            />
          </Pressable>
        </View>

        {/* ✅ DEVICES LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Devices</Text>
          <Text style={styles.sectionSmall}>Tap a device for tracking</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {devices.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="watch-outline"
                  size={26}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No Devices Added</Text>
              <Text style={styles.emptySub}>
                Add your first Ninfet device to enable live tracking and SOS
                safety.
              </Text>
            </View>
          ) : (
            devices.map((d) => {
              const status = getDeviceStatus(d);

              return (
                <Pressable
                  key={d.id}
                  style={styles.deviceCard}
                  onPress={() =>
                    router.push({
                      pathname: "/device-details",
                      params: { deviceId: d.id },
                    })
                  }
                >
                  <BMICard weight={d.weight} height={d.height} />
                  {/* Top row */}
                  <View style={styles.deviceTop}>
                    <View style={styles.deviceIcon}>
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.deviceName}>{d.deviceName}</Text>
                      <Text style={styles.deviceMeta} numberOfLines={1}>
                        Jacket ID: {d.jacketId}
                      </Text>
                    </View>

                    <StatusPill type={status} />
                  </View>

                  {/* Info chips */}
                  <View style={styles.chipRow}>
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>Blood</Text>
                      <Text style={styles.chipValue}>
                        {d.bloodGroup || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>Allergy</Text>
                      <Text style={styles.chipValue}>
                        {d.allergies || "None"}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom actions */}
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.smallBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/device-details",
                          params: { deviceId: d.id },
                        })
                      }
                    >
                      <Ionicons
                        name="eye"
                        size={14}
                        color={theme.colors.text}
                      />
                      <Text style={styles.smallBtnText}>Open</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.smallBtn,
                        { backgroundColor: theme.colors.dangerSoft },
                      ]}
                      onPress={() =>
                        Alert.alert(
                          "Delete Device?",
                          `Are you sure you want to delete "${d.deviceName}"?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => handleDeleteDevice(d.id),
                            },
                          ],
                        )
                      }
                    >
                      <Ionicons
                        name="trash"
                        size={14}
                        color={theme.colors.danger}
                      />
                      <Text
                        style={[
                          styles.smallBtnText,
                          { color: theme.colors.danger },
                        ]}
                      >
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })
          )}

          {/* bottom spacing */}
          <View style={{ height: 110 }} />
        </ScrollView>
      </AppScreen>

      {/* ✅ FAB BUTTON */}
      <FAB title="Add Device" onPress={() => router.push("/add-device")} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  hiText: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
  },

  subText: {
    marginTop: 5,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 14,
  },

  statLabel: {
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },

  statValue: {
    marginTop: 10,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 22,
  },

  quickRow: {
    gap: 12,
    marginBottom: 18,
  },

  quickCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  quickTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  quickSub: {
    marginTop: 3,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  sectionSmall: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  emptyBox: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 18,
    alignItems: "center",
    marginTop: 20,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  emptySub: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },

  deviceCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  deviceTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  deviceName: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
  deviceMeta: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  chipRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  chip: {
    flex: 1,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
  },

  chipLabel: { color: theme.colors.muted, fontWeight: "800", fontSize: 11 },
  chipValue: {
    marginTop: 5,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },

  cardActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  smallBtn: {
    flex: 1,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },
});
