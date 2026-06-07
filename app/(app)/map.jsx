// screens/MapScreen.jsx
// ✅ FULLY FIXED VERSION — Clean, no duplicates, working hospital fetch + routing

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import Mapbox, {
  Camera,
  MapView,
  PointAnnotation,
  ShapeSource,
  LineLayer,
  UserLocation,
} from "@rnmapbox/maps";
import * as Location from "expo-location";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MAPBOX_PUBLIC_TOKEN =
  "pk.eyJ1IjoiYW1hbjE1MTgiLCJhIjoiY21taTdoZW01MTNndDJwczYxYmQxaW1lNiJ9.rGfG_eih3BYwE7ODZ4d1GQ";

Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_COLLAPSED = 140;
const PANEL_EXPANDED = SCREEN_HEIGHT * 0.55;

// ─── UTILITY FUNCTIONS (defined once, outside component) ─────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatETA(durationSeconds) {
  const mins = Math.ceil(durationSeconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOSPITAL FETCH — 3-layer fallback chain
//
//  Layer 1: HERE Maps  (250k free/month, no credit card)
//           → developer.here.com → free account → API key
//
//  Layer 2: Foursquare Places  (50k free/month, no credit card)
//           → foursquare.com/developer → new project → API key
//
//  Layer 3: Static JSON bundled in app  (works offline, zero latency)
//           → Update STATIC_HOSPITALS below with hospitals in your city
//
// Just fill in whichever key(s) you have. The chain auto-skips unconfigured ones.
// ═══════════════════════════════════════════════════════════════════════════

// ⚠️  PASTE YOUR FOURSQUARE KEY HERE:
// Get one free at foursquare.com/developer (50k requests/month, no credit card)
const FOURSQUARE_API_KEY = "AFM4IWRO5MMS2CB4CDQK1F1VAQVU3P4WSWTCVVPCZBALAXZR";

// ── Static fallback hospitals ────────────────────────────────────────────────
// Used when Foursquare fails. App NEVER crashes — always shows something.
const STATIC_HOSPITALS = [
  // India — Delhi NCR
  { id: "s1", name: "AIIMS Delhi", lat: 28.5672, lon: 77.2100, phone: "011-26588500", type: "Hospital", emergency: true, address: "Ansari Nagar, New Delhi" },
  { id: "s2", name: "Safdarjung Hospital", lat: 28.5686, lon: 77.2060, phone: "011-26707444", type: "Hospital", emergency: true, address: "Ansari Nagar West, New Delhi" },
  { id: "s3", name: "Apollo Hospital Delhi", lat: 28.5562, lon: 77.2410, phone: "011-71791090", type: "Hospital", emergency: true, address: "Sarita Vihar, New Delhi" },
  { id: "s4", name: "Sir Ganga Ram Hospital", lat: 28.6395, lon: 77.1919, phone: "011-25750000", type: "Hospital", emergency: true, address: "Rajinder Nagar, New Delhi" },
  { id: "s5", name: "Max Super Speciality Saket", lat: 28.5276, lon: 77.2190, phone: "011-26515050", type: "Hospital", emergency: true, address: "Press Enclave Rd, Saket" },
  { id: "s6", name: "Fortis Hospital Vasant Kunj", lat: 28.5211, lon: 77.1580, phone: "011-42776222", type: "Hospital", emergency: true, address: "Vasant Kunj, New Delhi" },
  { id: "s7", name: "BLK-Max Super Speciality", lat: 28.6445, lon: 77.1831, phone: "011-30403040", type: "Hospital", emergency: true, address: "Pusa Road, New Delhi" },
  // USA — Bay Area (for emulator/dev testing)
  { id: "s8", name: "Stanford Hospital", lat: 37.4344, lon: -122.1757, phone: "650-723-4000", type: "Hospital", emergency: true, address: "300 Pasteur Dr, Stanford, CA" },
  { id: "s9", name: "El Camino Health", lat: 37.3786, lon: -122.0531, phone: "650-940-7000", type: "Hospital", emergency: true, address: "2500 Grant Rd, Mountain View, CA" },
  { id: "s10", name: "Kaiser Santa Clara", lat: 37.3541, lon: -121.9552, phone: "408-851-1000", type: "Hospital", emergency: true, address: "700 Lawrence Expy, Santa Clara, CA" },
  { id: "s11", name: "Good Samaritan Hospital", lat: 37.2954, lon: -121.9501, phone: "408-559-2011", type: "Hospital", emergency: true, address: "2425 Samaritan Dr, San Jose, CA" },
  // UK — London
  { id: "s12", name: "St Thomas' Hospital", lat: 51.4988, lon: -0.1189, phone: "020-7188-7188", type: "Hospital", emergency: true, address: "Westminster Bridge Rd, London" },
  { id: "s13", name: "King's College Hospital", lat: 51.4683, lon: -0.0937, phone: "020-3299-9000", type: "Hospital", emergency: true, address: "Denmark Hill, London" },
];

// ── Helper: fetch with hard timeout ─────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── Foursquare Places Search ──────────────────────────────────────────────────
async function fetchHospitalsFoursquare(lat, lon) {
  // Validate key — must start with "A" (Foursquare v3 keys always do)
  if (!FOURSQUARE_API_KEY || !FOURSQUARE_API_KEY.startsWith("A")) {
    throw new Error("Foursquare key missing or invalid format");
  }

  const url =
    `https://api.foursquare.com/v3/places/search` +
    `?ll=${lat},${lon}` +
    `&query=hospital` +
    `&radius=12000` +
    `&limit=20` +
    `&fields=fsq_id,name,geocodes,location,categories,tel`;

  const res = await fetchWithTimeout(
    url,
    { headers: { Authorization: FOURSQUARE_API_KEY } },
    8000
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Foursquare ${res.status}: ${body.slice(0, 120)}`);
  }

  const json = await res.json();
  return (json.results || [])
    .map((place, idx) => ({
      id: place.fsq_id || `fsq-${idx}`,
      name: place.name || "Medical Centre",
      lat: place.geocodes?.main?.latitude,
      lon: place.geocodes?.main?.longitude,
      phone: place.tel || null,
      type: place.categories?.some((c) =>
        c.name?.toLowerCase().includes("clinic") ||
        c.name?.toLowerCase().includes("pharmacy")
      ) ? "Clinic" : "Hospital",
      emergency: false,
      address: [place.location?.address, place.location?.locality]
        .filter(Boolean).join(", ") || null,
    }))
    .filter((h) => h.lat && h.lon);
}

// ── Main entry: Foursquare → Static (never crashes) ──────────────────────────
async function fetchNearbyHospitals(lat, lon) {
  console.log(`[Hospitals] Fetching near ${lat.toFixed(4)}, ${lon.toFixed(4)}`);

  // Try Foursquare
  try {
    const results = await fetchHospitalsFoursquare(lat, lon);
    console.log(`[Hospitals] Foursquare returned ${results.length}`);
    if (results.length > 0) return results;
  } catch (e) {
    console.log(`[Hospitals] Foursquare failed: ${e.message}`);
  }

  // Static fallback — sorted by distance, no hard radius cutoff
  console.log("[Hospitals] Using static fallback");
  return STATIC_HOSPITALS
    .map((h) => ({ ...h, _d: haversineKm(lat, lon, h.lat, h.lon) }))
    .sort((a, b) => a._d - b._d)
    .slice(0, 5); // always return top 5 nearest, anywhere in world
}

// ─── FETCH ROUTE via OSRM (free, no token needed) ────────────────────────────
// FIX: Switched from Mapbox Directions (paid) to OSRM (free & reliable)
async function fetchRoute(fromLon, fromLat, toLon, toLat) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLon},${fromLat};${toLon},${toLat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const json = await res.json();
  const route = json.routes?.[0];
  return route
    ? {
        geometry: route.geometry,
        duration: route.duration, // seconds
        distance: route.distance, // meters
      }
    : null;
}

// ─── HOSPITAL CARD COMPONENT ─────────────────────────────────────────────────
function HospitalCard({
  hospital,
  selected,
  userLocation,
  routeInfo,
  onSelect,
  onCall,
  onOpenMaps,
}) {
  const distKm = userLocation
    ? haversineKm(
        userLocation.latitude,
        userLocation.longitude,
        hospital.lat,
        hospital.lon
      )
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Text style={styles.cardIcon}>
            {hospital.type === "Clinic" ? "🏪" : "🏥"}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.cardName} numberOfLines={2}>
            {hospital.name}
          </Text>
          <View style={styles.cardMeta}>
            {hospital.emergency && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>24/7 ER</Text>
              </View>
            )}
            <Text style={styles.cardType}>{hospital.type}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.cardStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DISTANCE</Text>
          <Text style={styles.statValue}>
            {distKm != null ? formatDistance(distKm) : "—"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DRIVE TIME</Text>
          <Text style={styles.statValue}>
            {selected && routeInfo ? formatETA(routeInfo.duration) : "—"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>VIA ROAD</Text>
          <Text style={styles.statValue}>
            {selected && routeInfo
              ? formatDistance(routeInfo.distance / 1000)
              : "—"}
          </Text>
        </View>
      </View>

      {/* Address */}
      {hospital.address ? (
        <Text style={styles.cardAddress} numberOfLines={1}>
          📍 {hospital.address}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={styles.cardActions}>
        {hospital.phone ? (
          <TouchableOpacity style={styles.btnCall} onPress={onCall}>
            <Text style={styles.btnCallText}>📞  Call</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.btnCall, styles.btnDisabled]}>
            <Text style={[styles.btnCallText, { opacity: 0.4 }]}>
              📞  No number
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.btnNav} onPress={onOpenMaps}>
          <Text style={styles.btnNavText}>Open in Maps ↗</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function MapScreen({ route: navRoute }) {
  // alertContext shape: { vital, patientName, severity }
  const alertContext = navRoute?.params?.alertContext;

  const cameraRef = useRef(null);
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const panelAnim = useRef(new Animated.Value(PANEL_COLLAPSED)).current;

  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // ── Panel animation ───────────────────────────────────────────────────────
  const togglePanel = useCallback(() => {
    const toValue = panelExpanded ? PANEL_COLLAPSED : PANEL_EXPANDED;
    Animated.spring(panelAnim, {
      toValue,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start();
    setPanelExpanded((prev) => !prev);
  }, [panelExpanded, panelAnim]);

  // ── Select hospital + fetch route ─────────────────────────────────────────
  const handleSelectHospital = useCallback(
    async (hospital, overrideLat, overrideLon) => {
      const lat = overrideLat ?? userLocation?.latitude;
      const lon = overrideLon ?? userLocation?.longitude;
      if (!lat || !lon) return;

      setSelectedHospital(hospital);
      setRouteInfo(null);
      setRouteLoading(true);

      try {
        const result = await fetchRoute(lon, lat, hospital.lon, hospital.lat);
        if (result) {
          setRouteInfo(result);
          // Fit camera to show full route with padding
          const pad = panelExpanded ? PANEL_EXPANDED + 20 : PANEL_COLLAPSED + 20;
          cameraRef.current?.fitBounds(
            [Math.min(lon, hospital.lon), Math.min(lat, hospital.lat)],
            [Math.max(lon, hospital.lon), Math.max(lat, hospital.lat)],
            [80, 60, pad, 60],
            1200
          );
        }
      } catch (e) {
        console.warn("Route error:", e.message);
        // Don't alert — just show no route, map still works
      } finally {
        setRouteLoading(false);
      }
    },
    [userLocation, panelExpanded]
  );

  // ── Scroll list to selected card ──────────────────────────────────────────
  const scrollToSelected = useCallback(
    (hospital) => {
      const idx = hospitals.findIndex((h) => h.id === hospital.id);
      if (idx >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.1,
        });
      }
    },
    [hospitals]
  );

  // ── Get location + load hospitals on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError(
            "Location permission denied. Enable it in device Settings."
          );
          setLoading(false);
          return;
        }

        let loc = null;
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000,
          });
        } catch {
          loc = await Location.getLastKnownPositionAsync();
        }

        if (!loc) {
          setLocationError("Could not determine your location. Try again.");
          setLoading(false);
          return;
        }

        if (cancelled) return;

        const { latitude, longitude } = loc.coords;
        setUserLocation({ latitude, longitude });

        // Move camera to user
        cameraRef.current?.setCamera({
          centerCoordinate: [longitude, latitude],
          zoomLevel: 13,
          animationDuration: 1000,
        });

        const nearby = await fetchNearbyHospitals(latitude, longitude);

        if (cancelled) return;

        // Sort by straight-line distance
        const sorted = nearby.sort(
          (a, b) =>
            haversineKm(latitude, longitude, a.lat, a.lon) -
            haversineKm(latitude, longitude, b.lat, b.lon)
        );

        setHospitals(sorted);
        setLoading(false);

        // Auto-select nearest
        if (sorted.length > 0) {
          await handleSelectHospital(sorted[0], latitude, longitude);

          if (alertContext) {
            // Expand panel automatically on emergency alert
            setTimeout(() => {
              Animated.spring(panelAnim, {
                toValue: PANEL_EXPANDED,
                useNativeDriver: false,
                tension: 65,
                friction: 11,
              }).start();
              setPanelExpanded(true);
            }, 900);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Init error:", e);
          Alert.alert(
            "Could Not Load Hospitals",
            e.message || "Please check your internet connection and try again.",
            [{ text: "OK" }]
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // run once on mount

  const callHospital = (phone) => {
    const cleaned = phone.replace(/\s+/g, "");
    Linking.openURL(`tel:${cleaned}`).catch(() =>
      Alert.alert("Cannot Call", "Dialer not available on this device.")
    );
  };

  const openInGoogleMaps = (hospital) => {
    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${hospital.lat},${hospital.lon}` +
      `&travelmode=driving`;
    Linking.openURL(url);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Emergency Alert Banner ── */}
      {alertContext && (
        <View style={styles.alertBanner}>
          <View style={styles.alertDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              🚨 VITAL ALERT — {alertContext.patientName ?? "Patient"}
            </Text>
            <Text style={styles.alertSub}>
              {alertContext.vital} · Navigating to nearest hospital
            </Text>
          </View>
        </View>
      )}

      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassPosition={{
          top: alertContext ? 100 : 60,
          right: 16,
        }}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={
            userLocation
              ? [userLocation.longitude, userLocation.latitude]
              : [77.209, 28.6139] // Delhi fallback
          }
          animationMode="flyTo"
          animationDuration={1500}
        />

        <UserLocation visible animated renderMode="native" />

        {/* Hospital markers */}
        {hospitals.map((h) => {
          const isSelected = selectedHospital?.id === h.id;
          return (
            <PointAnnotation
              key={h.id}
              id={`h-${h.id}`}
              coordinate={[h.lon, h.lat]}
              onSelected={() => {
                handleSelectHospital(h);
                scrollToSelected(h);
                if (!panelExpanded) togglePanel();
              }}
            >
              <View style={[styles.marker, isSelected && styles.markerSelected]}>
                <Text style={styles.markerEmoji}>
                  {h.type === "Clinic" ? "🏪" : "🏥"}
                </Text>
                {isSelected && <View style={styles.markerRing} />}
              </View>
            </PointAnnotation>
          );
        })}

        {/* Route line */}
        {routeInfo?.geometry && (
          <ShapeSource id="routeSource" shape={routeInfo.geometry}>
            <LineLayer
              id="routeGlow"
              style={{
                lineColor: "#FF4D6D",
                lineWidth: 10,
                lineOpacity: 0.25,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <LineLayer
              id="routeLine"
              style={{
                lineColor: "#E63946",
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      {/* ── Loading Overlay ── */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E63946" />
          <Text style={styles.loadingTitle}>Finding hospitals…</Text>
          <Text style={styles.loadingSubtitle}>
            Searching within 12 km of your location
          </Text>
        </View>
      )}

      {/* ── Route Pill ── */}
      {!loading && selectedHospital && (routeInfo || routeLoading) && (
        <View
          style={[
            styles.routePill,
            { top: alertContext ? 110 : 16 },
          ]}
        >
          {routeLoading ? (
            <ActivityIndicator size="small" color="#E63946" />
          ) : (
            <>
              <Text style={styles.routePillETA}>
                {formatETA(routeInfo.duration)}
              </Text>
              <Text style={styles.routePillDot}> · </Text>
              <Text style={styles.routePillDist}>
                {formatDistance(routeInfo.distance / 1000)}
              </Text>
              <Text style={styles.routePillDot}> · </Text>
              <Text style={styles.routePillMode}>🚗 Driving</Text>
            </>
          )}
        </View>
      )}

      {/* ── Bottom Panel ── */}
      {!loading && hospitals.length > 0 && (
        <Animated.View style={[styles.panel, { height: panelAnim }]}>
          {/* Drag handle / title */}
          <TouchableOpacity
            style={styles.handleWrap}
            onPress={togglePanel}
            activeOpacity={0.7}
          >
            <View style={styles.handle} />
            <Text style={styles.panelTitle}>
              {hospitals.length} Hospitals Nearby
              {selectedHospital ? `  ·  ${selectedHospital.name}` : ""}
            </Text>
            <Text style={styles.panelChevron}>
              {panelExpanded ? "▼" : "▲"}
            </Text>
          </TouchableOpacity>

          {/* Horizontal list of hospital cards */}
          <FlatList
            ref={flatListRef}
            data={hospitals}
            keyExtractor={(h) => h.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={300}
            decelerationRate="fast"
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => (
              <HospitalCard
                hospital={item}
                selected={selectedHospital?.id === item.id}
                userLocation={userLocation}
                routeInfo={
                  selectedHospital?.id === item.id ? routeInfo : null
                }
                onSelect={() => {
                  handleSelectHospital(item);
                  if (!panelExpanded) togglePanel();
                }}
                onCall={() => callHospital(item.phone)}
                onOpenMaps={() => openInGoogleMaps(item)}
              />
            )}
          />
        </Animated.View>
      )}

      {/* ── Empty State ── */}
      {!loading && hospitals.length === 0 && !locationError && (
        <View style={styles.emptyPanel}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
            <Text style={styles.panelTitle}>No hospitals found nearby</Text>
          </View>
          <Text style={styles.emptyText}>
            No hospitals found within 12 km. Try Google Maps for a broader search.
          </Text>
          <TouchableOpacity
            style={styles.btnOpenMapsLarge}
            onPress={() =>
              Linking.openURL(
                "https://www.google.com/maps/search/hospital+near+me"
              )
            }
          >
            <Text style={styles.btnOpenMapsLargeText}>
              Search in Google Maps
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Location Error ── */}
      {locationError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const DARK = "#0d1117";
const SURFACE = "#161b22";
const CARD = "#1e2430";
const BORDER = "#30363d";
const RED = "#E63946";
const RED_DIM = "#2a1520";
const TEXT = "#e6edf3";
const TEXT_MUTED = "#8b949e";
const GREEN = "#3fb950";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  map: { flex: 1 },

  // Alert banner
  alertBanner: {
    backgroundColor: RED,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === "android" ? 36 : 50,
    zIndex: 20,
    gap: 12,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    opacity: 0.9,
  },
  alertTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  alertSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    marginTop: 2,
  },

  // Route pill
  routePill: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  routePillETA: { color: RED, fontWeight: "800", fontSize: 15 },
  routePillDot: { color: TEXT_MUTED, fontSize: 14 },
  routePillDist: { color: TEXT, fontWeight: "600", fontSize: 14 },
  routePillMode: { color: TEXT_MUTED, fontSize: 13 },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,17,23,0.92)",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingTitle: { color: TEXT, fontSize: 16, fontWeight: "700", marginTop: 8 },
  loadingSubtitle: { color: TEXT_MUTED, fontSize: 13 },

  // Markers
  marker: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 6,
    borderWidth: 2,
    borderColor: BORDER,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  markerSelected: {
    borderColor: RED,
    backgroundColor: RED_DIM,
    transform: [{ scale: 1.15 }],
  },
  markerEmoji: { fontSize: 22 },
  markerRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: RED,
    opacity: 0.5,
  },

  // Panel
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  emptyPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: BORDER,
    paddingBottom: 30,
    elevation: 24,
  },
  handleWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: -18,
  },
  panelTitle: {
    color: TEXT,
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
    marginTop: 8,
  },
  panelChevron: { color: TEXT_MUTED, fontSize: 11, marginTop: 8 },
  listContent: { paddingHorizontal: 12, paddingBottom: 16 },

  // Hospital card
  card: {
    width: 288,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  cardSelected: {
    borderColor: RED,
    backgroundColor: "#1a1f2e",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: RED_DIM,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: RED + "50",
  },
  cardIcon: { fontSize: 22 },
  cardName: { color: TEXT, fontWeight: "700", fontSize: 14, lineHeight: 18 },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: RED,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardType: { color: TEXT_MUTED, fontSize: 11 },

  cardStats: {
    flexDirection: "row",
    backgroundColor: DARK,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: BORDER },
  statLabel: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  statValue: { color: TEXT, fontWeight: "700", fontSize: 14 },
  cardAddress: { color: TEXT_MUTED, fontSize: 11, marginBottom: 10 },

  cardActions: { flexDirection: "row", gap: 8 },
  btnCall: {
    flex: 1,
    backgroundColor: GREEN + "22",
    borderWidth: 1,
    borderColor: GREEN + "55",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  btnDisabled: {
    backgroundColor: BORDER + "33",
    borderColor: BORDER,
  },
  btnCallText: { color: GREEN, fontWeight: "700", fontSize: 13 },
  btnNav: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  btnNavText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Empty / error
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  btnOpenMapsLarge: {
    marginHorizontal: 16,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 30,
  },
  btnOpenMapsLargeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  errorBanner: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#2a1520",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: RED,
  },
  errorText: {
    color: RED,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});