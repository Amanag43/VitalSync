// import { router } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
// import { auth, db } from "../firebaseConfig";

// import AppScreen from "../src/components/AppScreen";
// import EmergencyBanner from "../src/components/EmergencyBanner";
// import { useEmergencyStore } from "../src/store/emergencyStore";

// import { Ionicons } from "@expo/vector-icons";
// import { theme } from "../src/theme/theme";

// export default function AlertsScreen() {
//   const [alerts, setAlerts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const { emergencyActive } = useEmergencyStore();

//   useEffect(() => {
//     const uid = auth.currentUser?.uid;
//     if (!uid) return;

//     const ref = collection(db, "users", uid, "alerts");
//     const q = query(ref, orderBy("createdAt", "desc"));

//     const unsub = onSnapshot(q, (snap) => {
//       const list = snap.docs.map((d) => ({
//         id: d.id,
//         ...d.data(),
//       }));
//       setAlerts(list);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, []);

//   return (
//     <AppScreen>
//       {/* ✅ HEADER */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()} style={styles.iconBtn}>
//           <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
//         </Pressable>

//         <View style={{ flex: 1 }}>
//           <Text style={styles.title}>Alerts</Text>
//           <Text style={styles.subTitle}>SOS history & emergency logs</Text>
//         </View>

//         <Pressable
//           onPress={() => Alert.alert("Info", "Filters coming next ✅")}
//           style={styles.iconBtn}
//         >
//           <Ionicons name="filter" size={18} color={theme.colors.text} />
//         </Pressable>
//       </View>

//       {/* ✅ Emergency Banner */}
//       <EmergencyBanner
//         onOpenMap={() => {
//           Alert.alert(
//             "Emergency Mode",
//             "Open map from device details for live tracking ✅"
//           );
//         }}
//       />

//       {/* ✅ CONTENT */}
//       {loading ? (
//         <View style={styles.center}>
//           <ActivityIndicator size="large" color={theme.colors.primary} />
//           <Text style={styles.loadingText}>Loading alerts...</Text>
//         </View>
//       ) : (
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {alerts.length === 0 ? (
//             <View style={styles.emptyBox}>
//               <View style={styles.emptyIcon}>
//                 <Ionicons name="shield-outline" size={26} color={theme.colors.primary} />
//               </View>
//               <Text style={styles.emptyTitle}>No Alerts Yet</Text>
//               <Text style={styles.emptySub}>
//                 SOS alerts will appear here with vitals and location data.
//               </Text>
//             </View>
//           ) : (
//             alerts.map((a) => (
//               <View key={a.id} style={styles.card}>
//                 <View style={styles.rowTop}>
//                   <View style={styles.alertIcon}>
//                     <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
//                   </View>

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.cardTitle}>
//                       {a.reason || "Emergency Alert"}
//                     </Text>
//                     <Text style={styles.cardSub}>
//                       Jacket: {a.jacketId || "N/A"} • Status: {a.status || "ACTIVE"}
//                     </Text>
//                   </View>

//                   <View style={styles.badge}>
//                     <Text style={styles.badgeText}>SOS</Text>
//                   </View>
//                 </View>

//                 <View style={styles.metricsRow}>
//                   <Metric label="SpO2" value={`${a.spo2 ?? "--"}%`} />
//                   <Metric label="Pulse" value={`${a.pulse ?? "--"} bpm`} />
//                   <Metric label="Temp" value={`${a.temperature ?? "--"}°C`} />
//                 </View>

//                 <View style={styles.locBox}>
//                   <Ionicons name="location" size={16} color={theme.colors.muted} />
//                   <Text style={styles.locText}>
//                     {a.lat ? `${a.lat}, ${a.lng}` : "Location not available"}
//                   </Text>
//                 </View>
//               </View>
//             ))
//           )}

//           <View style={{ height: 30 }} />
//         </ScrollView>
//       )}
//     </AppScreen>
//   );
// }

// function Metric({ label, value }) {
//   return (
//     <View style={styles.metric}>
//       <Text style={styles.metricLabel}>{label}</Text>
//       <Text style={styles.metricValue}>{value}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   loadingText: { marginTop: 12, color: theme.colors.muted, fontWeight: "800" },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 14,
//   },

//   iconBtn: {
//     width: 42,
//     height: 42,
//     borderRadius: 16,
//     backgroundColor: theme.colors.chip,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   title: { color: theme.colors.text, fontSize: 20, fontWeight: "900" },
//   subTitle: { marginTop: 2, color: theme.colors.muted, fontWeight: "700", fontSize: 12 },

//   emptyBox: {
//     backgroundColor: theme.colors.card,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     borderRadius: theme.radius.xl,
//     padding: 18,
//     alignItems: "center",
//     marginTop: 20,
//   },

//   emptyIcon: {
//     width: 58,
//     height: 58,
//     borderRadius: 20,
//     backgroundColor: theme.colors.primarySoft,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 10,
//   },

//   emptyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
//   emptySub: {
//     marginTop: 6,
//     color: theme.colors.muted,
//     fontWeight: "700",
//     fontSize: 12,
//     textAlign: "center",
//   },

//   card: {
//     backgroundColor: theme.colors.card,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     borderRadius: theme.radius.xl,
//     padding: 16,
//     marginBottom: 12,
//   },

//   rowTop: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },

//   alertIcon: {
//     width: 46,
//     height: 46,
//     borderRadius: 18,
//     backgroundColor: theme.colors.dangerSoft,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   cardTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
//   cardSub: { marginTop: 4, color: theme.colors.muted, fontWeight: "700", fontSize: 12 },

//   badge: {
//     backgroundColor: theme.colors.dangerSoft,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 999,
//   },

//   badgeText: {
//     color: theme.colors.danger,
//     fontWeight: "900",
//     fontSize: 12,
//   },

//   metricsRow: {
//     flexDirection: "row",
//     gap: 10,
//     marginTop: 14,
//   },

//   metric: {
//     flex: 1,
//     backgroundColor: theme.colors.chip,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     borderRadius: 18,
//     padding: 12,
//     alignItems: "center",
//   },

//   metricLabel: { color: theme.colors.muted, fontWeight: "800", fontSize: 11 },
//   metricValue: { marginTop: 5, color: theme.colors.text, fontWeight: "900", fontSize: 13 },

//   locBox: {
//     marginTop: 12,
//     backgroundColor: theme.colors.chip,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     borderRadius: 18,
//     padding: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },

//   locText: {
//     color: theme.colors.muted,
//     fontWeight: "700",
//     fontSize: 12,
//     flex: 1,
//   },
// });
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreen from "../../src/components/AppScreen";
import EmergencyBanner from "../../src/components/EmergencyBanner";
import { useAuthStore } from "../../src/store/authStore";
import { useEmergencyStore } from "../../src/store/emergencyStore";
import { theme } from "../../src/theme/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Get Bearer token from Zustand (replaces Firebase auth.currentUser)
  const token = useAuthStore((s) => s.token);

  const { emergencyActive } = useEmergencyStore();

  // ✅ Fetch alerts from PHP API
  const fetchAlerts = useCallback(async () => {
    try {



      const json = await res.json();

      if (!json.success) {
        Alert.alert("Error", json.message || "Failed to load alerts");
        return;
      }

      setAlerts(json.alerts);
    } catch (err) {
      Alert.alert("Error", "Could not reach server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Fetch on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  return (
    <AppScreen>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subTitle}>SOS history & emergency logs</Text>
        </View>

        <Pressable onPress={fetchAlerts} style={styles.iconBtn}>
          <Ionicons name="refresh" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Emergency Banner */}
      <EmergencyBanner
        onOpenMap={() =>
          Alert.alert(
            "Emergency Mode",
            "Open map from device details for live tracking ✅",
          )
        }
      />

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {alerts.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="shield-outline"
                  size={26}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No Alerts Yet</Text>
              <Text style={styles.emptySub}>
                SOS alerts will appear here with vitals and location data.
              </Text>
            </View>
          ) : (
            alerts.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <View style={styles.alertIcon}>
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={theme.colors.danger}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {a.reason || "Emergency Alert"}
                    </Text>
                    <Text style={styles.cardSub}>
                      Jacket: {a.jacket_id || "N/A"} • Status:{" "}
                      {a.status || "ACTIVE"}
                    </Text>
                  </View>

                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>SOS</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <Metric label="SpO2" value={`${a.spo2 ?? "--"}%`} />
                  <Metric label="Pulse" value={`${a.pulse ?? "--"} bpm`} />
                  <Metric label="Temp" value={`${a.temperature ?? "--"}°C`} />
                </View>

                <View style={styles.locBox}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={theme.colors.muted}
                  />
                  <Text style={styles.locText}>
                    {a.lat ? `${a.lat}, ${a.lng}` : "Location not available"}
                  </Text>
                </View>

                {/* Timestamp */}
                <Text style={styles.timestamp}>
                  {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </AppScreen>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },

  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  cardSub: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  badge: {
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  badgeText: { color: theme.colors.danger, fontWeight: "900", fontSize: 12 },

  metricsRow: { flexDirection: "row", gap: 10, marginTop: 14 },

  metric: {
    flex: 1,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
  },

  metricLabel: { color: theme.colors.muted, fontWeight: "800", fontSize: 11 },
  metricValue: {
    marginTop: 5,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 13,
  },

  locBox: {
    marginTop: 12,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  locText: {
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
    flex: 1,
  },

  timestamp: {
    marginTop: 10,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "right",
  },
});

