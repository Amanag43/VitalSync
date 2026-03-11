import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../src/components/AppButton";
import AppScreen from "../../src/components/AppScreen";
import StatusPill from "../../src/components/StatusPill";
import { theme } from "../../src/theme/theme";

import { useAuthStore } from "../../src/store/authStore";

export default function DeviceDetails() {
  const { deviceId } = useLocalSearchParams();
  const token = useAuthStore((s) => s.token);

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://192.168.1.16/iotjacket-api-php/api/v1";

  useEffect(() => {
    if (!token || !deviceId) return;

    const fetchDevice = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/devices/details.php?id=${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const text = await res.text();

        if (text.startsWith("<")) {
          console.error("Server returned HTML:", text);
          throw new Error("Server error");
        }

        const data = JSON.parse(text);

        if (!res.ok || !data.device) {
          Alert.alert("Not Found", "Device not found");
          router.back();
          return;
        }

        setDevice(data.device);
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId, token]);

  const getStatus = () => "online";

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading device details...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!device) {
    return (
      <AppScreen>
        <Text style={{ color: theme.colors.text, fontWeight: "900" }}>
          Device not found.
        </Text>
      </AppScreen>
    );
  }

  // ⬇️ YOUR EXISTING UI CONTINUES BELOW (UNCHANGED)

  return (
    <AppScreen>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Device Details</Text>
          <Text style={styles.subTitle}>Track & manage your Device</Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/edit-device",
              params: { deviceId: device.id },
            })
          }
          style={styles.iconBtn}
        >
          <Ionicons name="create-outline" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* ✅ MAIN DEVICE CARD */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceTopRow}>
            <View style={styles.deviceIcon}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={theme.colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{device.deviceName}</Text>
              <Text style={styles.deviceMeta}>
                Jacket ID: {device.jacket_id}
              </Text>
            </View>

            <StatusPill type={getStatus()} />
          </View>

          {/* CTA BUTTONS */}
          <View style={styles.ctaRow}>
            <Pressable
              style={styles.ctaBtnPrimary}
              onPress={() =>
                router.push({
                  pathname: "/map",
                  params: { jacketId: device.jacket_id },
                })
              }
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.ctaTextPrimary}>Track Live</Text>
            </Pressable>

            <Pressable
              style={styles.ctaBtnSecondary}
              onPress={() =>
                router.push({
                  pathname: "/edit-device",
                  params: { deviceId: device.id },
                })
              }
            >
              <Ionicons
                name="settings-outline"
                size={16}
                color={theme.colors.text}
              />
              <Text style={styles.ctaTextSecondary}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* ✅ PROFILE INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Profile</Text>

          <View style={styles.grid}>
            <InfoBox icon="calendar" label="Age" value={device.age || "N/A"} />
            <InfoBox
              icon="barbell"
              label="Weight"
              value={device.weight ? `${device.weight} kg` : "N/A"}
            />
            <InfoBox
              icon="resize"
              label="Height"
              value={device.height ? `${device.height} cm` : "N/A"}
            />
            <InfoBox
              icon="water"
              label="Blood"
              value={device.bloodGroup || "N/A"}
            />
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Allergies</Text>
            <Text style={styles.noteValue}>{device.allergies || "None"}</Text>
          </View>
        </View>

        {/* ✅ QUICK ACTIONS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>

          <Pressable
            style={styles.actionItem}
            onPress={() =>
              router.push({
                pathname: "/alert",
                params: { jacket_id: device.jacket_id },
              })
            }
          >
            <View
              style={[
                styles.actionIcon,
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
              <Text style={styles.actionTitle}>View Alerts</Text>
              <Text style={styles.actionSub}>
                Check SOS history for this account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.muted}
            />
          </Pressable>

          <Pressable
            style={styles.actionItem}
            onPress={() => router.push("/contacts")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <Ionicons name="call" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Emergency Contacts</Text>
              <Text style={styles.actionSub}>People to notify in SOS</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.muted}
            />
          </Pressable>
        </View>

        {/* ✅ EXTRA POLISH */}
        <AppButton
          title="📍 Open Live Map"
          onPress={() =>
            router.push({
              pathname: "/map",
              params: { jacketId: device.jacketId },
            })
          }
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </AppScreen>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <View style={styles.infoBox}>
      <Ionicons name={icon} size={16} color={theme.colors.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: theme.colors.muted, fontWeight: "800" },

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

  title: { color: theme.colors.text, fontSize: 20, fontWeight: "900" },
  subTitle: {
    marginTop: 2,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  deviceCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  deviceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  deviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  deviceName: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  deviceMeta: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  ctaBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  ctaTextPrimary: { color: "#fff", fontWeight: "900" },

  ctaBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  ctaTextSecondary: { color: theme.colors.text, fontWeight: "900" },

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  cardTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 12,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  infoBox: {
    width: "48%",
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
  },

  infoLabel: {
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
    marginTop: 6,
  },
  infoValue: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
    marginTop: 4,
  },

  noteBox: {
    marginTop: 14,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
  },

  noteTitle: { color: theme.colors.muted, fontWeight: "800", fontSize: 12 },
  noteValue: { color: theme.colors.text, fontWeight: "900", marginTop: 6 },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: { color: theme.colors.text, fontWeight: "900" },
  actionSub: {
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 3,
  },
});

