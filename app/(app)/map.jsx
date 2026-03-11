import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";

import { sendAlert } from "../../src/services/apiService";

import { useAuthStore } from "../../src/store/authStore";
import { useEmergencyStore } from "../../src/store/emergencyStore";
import { useHealthStore } from "../../src/store/healthStore";

import { theme } from "../../src/theme/theme";

/* ───────── helpers ───────── */
const getHealthColor = (type, value) => {
  if (type === "spo2" && value < 90) return "#FEE2E2";
  if (type === "pulse" && (value < 45 || value > 140)) return "#FFEDD5";
  return theme.colors.chip;
};

export default function MapScreen() {
  /* ───────── auth ───────── */
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore.getState().getUserId();

  /* ───────── global stores ───────── */
  const { vitals, lastUpdated } = useHealthStore();
  const { emergencyActive, startEmergency } = useEmergencyStore();

  /* ───────── refs ───────── */
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);

  /* ───────── state ───────── */
  const [location, setLocation] = useState({
    lat: 28.6139,
    lng: 77.209,
  });

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [navMode, setNavMode] = useState(false);

  /* ───────── auth guard ───────── */
  useEffect(() => {
    if (!token) router.replace("/(auth)/login");
  }, [token]);

  /* ───────── EMERGENCY TRIGGER (FROM GLOBAL VITALS) ───────── */
  useEffect(() => {
    if (!vitals) return;

    const { spo2, heartRate } = vitals;

    let reason = null;

    if (spo2 && spo2 < 90) reason = "Low SpO2 detected";
    if (heartRate && (heartRate < 45 || heartRate > 140))
      reason = "Abnormal pulse detected";

    if (reason && !emergencyActive && userId) {
      startEmergency(reason, vitals, location);

      sendAlert({
        userId,
        type: "HEALTH_ALERT",
        severity: "CRITICAL",
        message: reason,
      });

      fetchHospitals();
      bottomSheetRef.current?.snapToIndex(2);

      Alert.alert("🚨 Emergency", reason);
    }
  }, [vitals]);

  /* ───────── hospitals ───────── */
  const fetchHospitals = async () => {
    try {
      const query = `
[out:json];
(node["amenity"="hospital"](around:8000,${location.lat},${location.lng}););
out;`;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      });

      const data = await res.json();

      setHospitals(
        data.elements.map((h) => ({
          id: String(h.id),
          name: h.tags?.name || "Hospital",
          lat: h.lat,
          lng: h.lon,
          phone: h.tags?.phone || null,
        })),
      );
    } catch {
      Alert.alert("Error", "Failed to fetch hospitals");
    }
  };

  /* ───────── routing ───────── */
  const fetchRouteToHospital = async (hospital) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${location.lng},${location.lat};${hospital.lng},${hospital.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    const route = data.routes[0];

    setRouteCoords(
      route.geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      })),
    );

    setRouteInfo({
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMin: Math.ceil(route.duration / 60),
    });

    setNavMode(true);
  };

  /* ───────── SOS ───────── */
  const handleSOS = async () => {
    if (!userId) return;

    await sendAlert({
      userId,
      message: "Manual SOS",
      ...vitals,
      ...location,
    });

    Alert.alert("🚨 SOS SENT");
    fetchHospitals();
  };

  const snapPoints = useMemo(() => ["28%", "55%", "85%"], []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.lat,
            longitude: location.lng,
          }}
          pinColor={emergencyActive ? "red" : "blue"}
        />

        {hospitals.map((h) => (
          <Marker
            key={h.id}
            coordinate={{ latitude: h.lat, longitude: h.lng }}
            title={h.name}
            onPress={() => fetchRouteToHospital(h)}
          />
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor="#2563EB"
          />
        )}
      </MapView>

      {/* SOS BUTTON */}
      <Pressable style={styles.sos} onLongPress={handleSOS}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>SOS</Text>
      </Pressable>

      <BottomSheet ref={bottomSheetRef} index={0} snapPoints={snapPoints}>
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#fff" }}>SpO2: {vitals?.spo2 ?? "--"}</Text>
          <Text style={{ color: "#fff" }}>HR: {vitals?.heartRate ?? "--"}</Text>
          <Text style={{ color: "#aaa" }}>
            Updated: {lastUpdated?.toLocaleTimeString() || "--"}
          </Text>
        </View>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sos: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "red",
    padding: 16,
    borderRadius: 50,
  },
});

