import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";
import PrimaryAidCard from "../src/components/PrimaryAidCard";
import { useAuthStore } from "../src/store/authStore";
import { useEmergencyStore } from "../src/store/emergencyStore";
import { theme } from "../src/theme/theme";

const BACKEND_URL = "http://192.168.1.16/iotjacket-api-php/api/v1";

/* ───────── helpers ───────── */
const getHealthColor = (type, value) => {
  if (type === "spo2" && value < 90) return "#FEE2E2";
  if (type === "pulse" && (value < 45 || value > 140)) return "#FFEDD5";
  if (type === "temp" && value > 39) return "#FEE2E2";
  return theme.colors.chip;
};

export default function MapScreen() {
  /* ───────── auth & params ───────── */
  const token = useAuthStore((s) => s.token);
  const { jacketId } = useLocalSearchParams();

  /* ───────── refs ───────── */
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);

  /* ───────── stores ───────── */
  const startEmergency = useEmergencyStore((s) => s.startEmergency);
  const emergencyActive = useEmergencyStore((s) => s.emergencyActive);
  const emergencyReason = useEmergencyStore((s) => s.emergencyReason);
  const stopEmergency = useEmergencyStore((s) => s.stopEmergency);

  /* ───────── state ───────── */
  const [location, setLocation] = useState({
    lat: Number(28.6139),
    lng: Number(77.209),
  });

  const lastLocationRef = useRef(location);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [health, setHealth] = useState({
    spo2: 98,
    pulse: 78,
    temperature: 36.7,
  });
  const [deviceStats, setDeviceStats] = useState({
    battery: 78,
    signal: -92,
  });

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [navMode, setNavMode] = useState(false);
  const [search, setSearch] = useState("");
  const [sosSent, setSosSent] = useState(false);

  const sosLock = useRef(false);
  const shouldTriggerSOS = ({ spo2, pulse, temperature }) => {
    const s = Number(spo2);
    const p = Number(pulse);
    const t = Number(temperature);

    if (Number.isFinite(s) && s < 90) {
      return "Low SpO2 detected";
    }

    if (Number.isFinite(p) && (p < 45 || p > 140)) {
      return "Abnormal pulse detected";
    }

    if (Number.isFinite(t) && t > 39) {
      return "High body temperature detected";
    }

    return null;
  };

  /* ───────── auth guard ───────── */
  useEffect(() => {
    if (!token) router.replace("/(auth)/login");
  }, [token]);

  /* ───────── snap points ───────── */
  const snapPoints = useMemo(() => ["28%", "55%", "85%"], []);

  /* ───────── utils ───────── */
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const animateToLocation = (lat, lng, heading = 0) => {
    if (!mapRef.current) return;

    mapRef.current.animateCamera(
      {
        center: { latitude: lat, longitude: lng },
        zoom: navMode ? 17 : 14,
        pitch: navMode ? 60 : 0,
        heading: navMode ? heading : 0,
      },
      { duration: 800 },
    );
  };

  /* ───────── live vitals fetch ───────── */
  useEffect(() => {
    if (!jacketId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/vitals/latest.php?jacket_id=${jacketId}`,
        );

        const text = await res.text();
        if (!text || text.startsWith("<")) return;

        const json = JSON.parse(text);

        // ✅ HARD GUARD (MOST IMPORTANT)
        if (!json || typeof json !== "object") return;
        if (!json.success) return;
        if (!json.data || typeof json.data !== "object") return;

        const data = json.data;
        setLastUpdated(new Date());

        // ✅ LOCATION (SAFE)
        const lat = Number(data.lat);
        const lng = Number(data.lng);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          lastLocationRef.current = { lat, lng };
          setLocation({ lat, lng });

          if (navMode && Number.isFinite(lat) && Number.isFinite(lng)) {
            const heading = Math.random() * 360; // simulated heading
            animateToLocation(lat, lng, heading);
          }
        }

        // ✅ HEALTH (SAFE)
        setHealth((prev) => ({
          spo2: Number(data.spo2) || prev.spo2,
          pulse: Number(data.pulse) || prev.pulse,
          temperature: Number(data.temperature) || prev.temperature,
        }));

        // ✅ DEVICE STATS (SAFE)
        setDeviceStats((prev) => ({
          battery: Number(data.battery) || prev.battery,
          signal: Number(data.signal) || prev.signal,
        }));

        // 🔴 AUTO SOS CHECK (SAFE)
        const sosReason = shouldTriggerSOS({
          spo2: Number(data.spo2),
          pulse: Number(data.pulse),
          temperature: Number(data.temperature),
        });

        if (sosReason && !sosLock.current) {
          sosLock.current = true;
          startEmergency(sosReason);
          handleSOS(sosReason);
        }
      } catch (err) {
        console.log("Live fetch error:", err.message);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jacketId, navMode]);

  /* ───────── hospitals ───────── */
  const fetchHospitals = async () => {
    try {
      const radius = 8000;
      const query = `
[out:json];
(node["amenity"="hospital"](around:${radius},${location.lat},${location.lng}););
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

      bottomSheetRef.current?.snapToIndex(1);
    } catch {
      Alert.alert("Error", "Failed to fetch hospitals");
    }
  };
  const fetchRouteToHospital = async (hospital) => {
    try {
      const lat1 = Number(location.lat);
      const lng1 = Number(location.lng);
      const lat2 = Number(hospital.lat);
      const lng2 = Number(hospital.lng);

      if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lng1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lng2)
      ) {
        console.log("Invalid route coordinates");
        return;
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || !data.routes.length) {
        console.log("No route found");
        return;
      }

      const route = data.routes[0];

      const coords = route.geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));

      setRouteCoords(coords);
      setRouteInfo({
        distanceKm: (route.distance / 1000).toFixed(2),
        durationMin: Math.ceil(route.duration / 60),
      });

      setNavMode(true);
      animateToLocation(lat1, lng1);
    } catch (err) {
      console.log("Route error:", err.message);
    }
  };

  const filteredHospitals = hospitals
    .map((h) => ({
      ...h,
      distanceKm: getDistanceKm(location.lat, location.lng, h.lat, h.lng),
    }))
    .filter((h) => h.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  /* ───────── SOS ───────── */
  const handleSOS = async (reason = "Manual SOS") => {
    if (sosSent || !jacketId) return;
    setSosSent(true);

    await fetch(`${BACKEND_URL}/alerts/add.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jacketId,
        reason,
        ...health,
        ...location,
      }),
    });

    Alert.alert("🚨 SOS SENT", reason);
    fetchHospitals();
  };

  /* ───────── render ───────── */
  const getArrowPoints = (coords) => coords.filter((_, i) => i % 6 === 0);

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
        {Number.isFinite(location.lat) && Number.isFinite(location.lng) && (
          <Marker
            coordinate={{
              latitude: location.lat,
              longitude: location.lng,
            }}
            pinColor={emergencyActive ? "red" : "blue"}
          />
        )}
        {/* Hospitals */}
        {hospitals.map((h) => {
          const latitude = Number(h.lat);
          const longitude = Number(h.lng);

          // ❗ very important: skip invalid coords
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return (
            <Marker
              key={h.id}
              coordinate={{
                latitude,
                longitude,
              }}
              title={h.name}
              pinColor={selectedHospital?.id === h.id ? "green" : "purple"}
              onPress={() => {
                setSelectedHospital(h);
                fetchRouteToHospital(h);
                bottomSheetRef.current?.snapToIndex(1);
              }}
            />
          );
        })}

        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeWidth={6}
              strokeColor="#2563EB"
            />

            {getArrowPoints(routeCoords).map((point, idx) => (
              <Marker key={idx} coordinate={point} anchor={{ x: 0.5, y: 0.5 }}>
                <Ionicons name="arrow-forward" size={18} color="#2563EB" />
              </Marker>
            ))}
          </>
        )}
      </MapView>
      <Pressable
        style={styles.recenterBtn}
        onPress={() => {
          if (
            !Number.isFinite(location.lat) ||
            !Number.isFinite(location.lng)
          ) {
            Alert.alert("Location unavailable");
            return;
          }

          mapRef.current?.animateCamera(
            {
              center: {
                latitude: location.lat,
                longitude: location.lng,
              },
              zoom: navMode ? 17 : 15,
              pitch: navMode ? 60 : 0,
              heading: navMode ? 0 : undefined,
            },
            { duration: 700 },
          );
        }}
      >
        <Ionicons name="locate" size={22} color="#2563EB" />
      </Pressable>

      {/* SOS BUTTON */}
      <Pressable
        onLongPress={() => handleSOS()}
        delayLongPress={1200}
        style={styles.floatingSOS}
      >
        <Ionicons name="alert" size={26} color="#fff" />
        <Text style={styles.floatingSOSText}>HOLD FOR SOS</Text>
      </Pressable>

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Live Tracking</Text>
      </View>

      {/* SINGLE MERGED BOTTOM SHEET */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: "#020617" }}
        handleIndicatorStyle={{ backgroundColor: "#64748B" }}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.cardTitle}>Jacket ID: {jacketId}</Text>
          <Text style={styles.meta}>
            Last update: {lastUpdated?.toLocaleTimeString() || "—"}
          </Text>

          <PrimaryAidCard />

          <View style={styles.row}>
            <Chip
              label="SpO2"
              value={`${health.spo2}%`}
              bgColor={getHealthColor("spo2", health.spo2)}
            />
            <Chip
              label="Pulse"
              value={`${health.pulse} bpm`}
              bgColor={getHealthColor("pulse", health.pulse)}
            />
            <Chip
              label="Temp"
              value={`${health.temperature}°C`}
              bgColor={getHealthColor("temp", health.temperature)}
            />
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>🔋 {deviceStats.battery}%</Text>
            <Text style={styles.statusText}>📶 {deviceStats.signal} dBm</Text>
          </View>

          <Pressable style={styles.primaryBtn} onPress={fetchHospitals}>
            <Text style={styles.primaryText}>Nearby Hospitals</Text>
          </Pressable>
          {routeInfo && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "#22C55E", fontWeight: "900" }}>
                🚗 {routeInfo.distanceKm} km • {routeInfo.durationMin} min
              </Text>
            </View>
          )}

          {filteredHospitals.length > 0 && (
            <BottomSheetFlatList
              data={filteredHospitals}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.hospitalItem}>
                  <Text style={styles.hospitalName}>{item.name}</Text>
                  <Text style={styles.hospitalDist}>
                    {item.distanceKm.toFixed(2)} km away
                  </Text>
                  <Pressable
                    onPress={() => {
                      const latitude = Number(item.lat);
                      const longitude = Number(item.lng);

                      if (
                        !Number.isFinite(latitude) ||
                        !Number.isFinite(longitude)
                      ) {
                        Alert.alert("Invalid hospital location");
                        return;
                      }

                      setSelectedHospital(item);
                      fetchRouteToHospital(item);
                      setNavMode(true);

                      mapRef.current?.animateCamera(
                        {
                          center: {
                            latitude,
                            longitude,
                          },
                          zoom: 14,
                        },
                        { duration: 700 },
                      );
                    }}
                  ></Pressable>
                  <Pressable
                    style={styles.callBtn}
                    onPress={() =>
                      Linking.openURL(
                        item.phone ? `tel:${item.phone}` : "tel:108",
                      )
                    }
                  >
                    <Text style={styles.callText}>Call</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

/* ───────── chip ───────── */
function Chip({ label, value, bgColor }) {
  return (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 45,
    left: 16,
    right: 16,
    flexDirection: "row",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#111827",
  },
  backBtn: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 12,
  },
  backText: { color: "#fff", fontWeight: "900" },
  title: { color: "#fff", flex: 1, textAlign: "center", fontWeight: "900" },
  recenterBtn: {
    position: "absolute",
    right: 16,
    bottom: 360, // 👈 ABOVE bottom sheet
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 50,
  },

  floatingSOS: {
    position: "absolute",
    right: 18,
    bottom: 300,
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
  },
  floatingSOSText: { color: "#fff", fontWeight: "900" },

  sheetContent: { padding: 16 },
  cardTitle: { color: "#fff", fontWeight: "900" },
  meta: { color: "#94A3B8", marginBottom: 8 },

  row: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  chipLabel: { color: "#94A3B8", fontSize: 12 },
  chipValue: { color: "#fff", fontWeight: "900" },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  statusText: { color: "#fff", fontWeight: "800" },

  primaryBtn: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: { color: "#fff", fontWeight: "900" },

  hospitalItem: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  hospitalName: { fontWeight: "900" },
  hospitalDist: { color: "#666" },
  callBtn: {
    marginTop: 8,
    backgroundColor: "#DC2626",
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  callText: { color: "#fff", fontWeight: "800" },
});
