import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getDevices, getAlerts } from "../../src/services/apiService";

import AppScreen from "../../src/components/AppScreen";
import BMICard from "../../src/components/BMICard";
import EmergencyBanner from "../../src/components/EmergencyBanner";
import FAB from "../../src/components/FAB";
import PrimaryAidCard from "../../src/components/PrimaryAidCard";
import StatusPill from "../../src/components/StatusPill";

import { useAuthStore } from "../../src/store/authStore";
import { useEmergencyStore } from "../../src/store/emergencyStore";
import { theme } from "../../src/theme/theme";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const emergencyActive = useEmergencyStore((s) => s.emergencyActive);
  const emergencyReason = useEmergencyStore((s) => s.emergencyReason);
  const stopEmergency = useEmergencyStore((s) => s.stopEmergency);

  const BASE_URL = "http://192.168.1.11:5000";

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const userLabel = user?.email ?? "User";
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

 useFocusEffect(
   useCallback(() => {
     const fetchData = async () => {
       const userId = user?.id;
       if (!userId) return;

       try {
         setLoading(true);
         setAlertsLoading(true);

         const deviceData = await getDevices(userId);
         setDevices(deviceData || []);

         const alertData = await getAlerts(userId);
         setAlerts(alertData || []);

       } catch (err) {
         console.log("Fetch error:", err.message);
       } finally {
         setLoading(false);
         setAlertsLoading(false);
       }
     };

     fetchData();
   }, [user?.id])
 );

const handleDeleteDevice = async (deviceId) => {
  try {
    await fetch(`${BASE_URL}/devices/${deviceId}`, {
      method: "DELETE",
    });

    setDevices((prev) => prev.filter((d) => d._id !== deviceId));
  } catch (err) {
    Alert.alert("Delete Failed", err.message);
  }
};

  const devicesCount = useMemo(() => devices.length, [devices]);
  const getDeviceStatus = () => "online";

  return (
    <View style={{ flex: 1 }}>
      <AppScreen>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hiText}>Dashboard</Text>
            <Text style={styles.subText}>Logged in as: {userLabel}</Text>
          </View>

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
        {/* EMERGENCY */}
        {emergencyActive && (
          <View style={styles.emergencyCard}>
            <Ionicons name="warning" size={22} color="#fff" />
            <Text style={styles.emergencyText}>
              {emergencyReason || "Critical vitals detected"}
            </Text>

            <Pressable onPress={stopEmergency} style={styles.dismissBtn}>
              <Text style={{ fontWeight: "900" }}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        <EmergencyBanner
          onOpenMap={() => {
            if (!devices.length) {
              Alert.alert("No Device", "Add a device first");
              return;
            }
            router.push({
              pathname: "/map",
              params: { jacketId: devices[0].jacketId },
            });
          }}
        />

        <PrimaryAidCard />

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Devices</Text>
            <Text style={styles.statValue}>{devicesCount}</Text>
          </View>
        </View>

        {/* DEVICES */}

        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {alertsLoading ? (
          <ActivityIndicator />
        ) : alerts.length === 0 ? (
          <Text style={styles.emptyText}>No alerts yet</Text>
        ) : (
          alerts.map((a) => (
            <Pressable
              key={a._id}
              style={styles.alertCard}
              onPress={() =>
                router.push({
                  pathname: "/alert",
                  params: { alertId: a._id },
                })
              }
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={theme.colors.danger}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.alertReason}>{a.reason}</Text>
                <Text style={styles.alertMeta}>
                  Jacket {a.jacketId} •{" "}
                  {new Date(a.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        <Text style={styles.sectionTitle}>My Devices</Text>

        <ScrollView>
          {devices.length === 0 ? (
            <Text style={styles.emptyText}>No devices added</Text>
          ) : (
            devices.map((d) => (
              <Pressable
                key={d._id}
                style={styles.deviceCard}
                onPress={() =>
                  router.push({
                    pathname: "/device-details",
                    params: { deviceId: d._id },
                  })
                }
              >
                <BMICard weight={d.weight} height={d.height} />

                <View style={styles.deviceTop}>
                  <Text style={styles.deviceName}>{d.deviceName}</Text>
                  <StatusPill type={getDeviceStatus(d)} />
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.smallBtn}
                    onPress={() => handleDeleteDevice(d._id)}
                  >
                    <Ionicons
                      name="trash"
                      size={14}
                      color={theme.colors.danger}
                    />
                    <Text style={{ color: theme.colors.danger }}>Delete</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </AppScreen>

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
  alertCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: theme.colors.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertReason: {
    fontWeight: "900",
    color: theme.colors.text,
  },
  alertMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.muted,
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
