import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreen from "../../src/components/AppScreen";
import { useAuthStore } from "../../src/store/authStore";
import { theme } from "../../src/theme/theme";

const API_BASE = "http://192.168.1.16/iotjacket-api-php/api/v1";

export default function AlertDetailScreen() {
  const { alertId } = useLocalSearchParams();
  const token = useAuthStore((s) => s.token);

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !alertId) return;

    const fetchAlert = async () => {
      try {
        const res = await fetch(`${API_BASE}/alerts/detail.php?id=${alertId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        if (text.startsWith("<")) return;

        const data = JSON.parse(text);
        if (data.success) {
          setAlert(data.alert);
        }
      } catch (e) {
        console.log(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [alertId, token]);

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!alert) {
    return (
      <AppScreen>
        <Text>Alert not found</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.card}>
        <Ionicons name="alert-circle" size={30} color={theme.colors.danger} />

        <Text style={styles.reason}>{alert.reason}</Text>

        <Text style={styles.meta}>Jacket ID: {alert.jacket_id}</Text>
        <Text style={styles.meta}>Status: {alert.status}</Text>
        <Text style={styles.meta}>
          {new Date(alert.created_at).toLocaleString()}
        </Text>

        <View style={styles.row}>
          <Text>SpO₂: {alert.spo2 ?? "-"}</Text>
          <Text>Pulse: {alert.pulse ?? "-"}</Text>
          <Text>Temp: {alert.temperature ?? "-"}</Text>
        </View>

        <Text style={styles.meta}>
          Location: {alert.lat}, {alert.lng}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: {
    fontWeight: "800",
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: 18,
    borderRadius: 18,
    gap: 8,
  },
  reason: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  meta: {
    fontWeight: "700",
    color: theme.colors.muted,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
});
