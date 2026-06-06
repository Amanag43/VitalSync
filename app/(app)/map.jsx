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
const MAPBOX_PUBLIC_TOKEN = process.env.MAPBOX_PUBLIC_TOKEN;

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

// ─── FETCH HOSPITALS ─────────────────────────────────────────────────────────
// Strategy: Try Google Places first (fast, reliable), fallback to Overpass OSM.
// You MUST set your Google Places API key below (free tier = 200 req/day).

// ⚠️  PASTE YOUR GOOGLE PLACES API KEY HERE:
// const GOOGLE_PLACES_KEY = "AIzaSyBqQ4ojxjTzjVQkqz0UCrQ_8K2jLCJOM2Y";

// ── Option A: Google Places Nearby Search ────────────────────────────────────
// async function fetchHospitalsGoogle(lat, lon, radiusMeters = 12000) {
//   if (!GOOGLE_PLACES_KEY || GOOGLE_PLACES_KEY === "YOUR_GOOGLE_PLACES_API_KEY") {
//     throw new Error("No Google Places key configured");
//   }
//
//   const url =
//     `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
//     `?location=${lat},${lon}` +
//     `&radius=${radiusMeters}` +
//     `&type=hospital` +
//     `&key=${GOOGLE_PLACES_KEY}`;
//
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
//   const json = await res.json();
//
//   if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
//     throw new Error(`Google Places error: ${json.status} — ${json.error_message || ""}`);
//   }
//
//   return (json.results || []).map((place, idx) => ({
//     id: place.place_id || String(idx),
//     name: place.name || "Medical Centre",
//     lat: place.geometry.location.lat,
//     lon: place.geometry.location.lng,
//     phone: null, // Nearby Search doesn't return phone; use Place Details if needed
//     type: place.types?.includes("hospital") ? "Hospital" : "Clinic",
//     emergency: false,
//     address: place.vicinity || null,
//     rating: place.rating || null,
//     open: place.opening_hours?.open_now ?? null,
//   }));
// }

// ── Option B: Overpass OSM fallback (slower but free) ────────────────────────
async function fetchHospitalsOverpass(lat, lon, radiusMeters = 2000) {
  // Minimal query — fewer tags = faster response
  const query =
    `[out:json][timeout:25];` +
    `(node["amenity"~"hospital|clinic"](around:${radiusMeters},${lat},${lon});` +
    `way["amenity"~"hospital|clinic"](around:${radiusMeters},${lat},${lon}););` +
    `out center tags;`;

  const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const url of ENDPOINTS) {
    try {
      // Use AbortController for a hard 20s timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      console.log(`[Overpass] Got ${json.elements?.length} elements from ${url}`);

      return (json.elements || [])
        .map((el) => {
          const tags = el.tags || {};
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          if (!elLat || !elLon) return null;
          return {
            id: String(el.id),
            name: tags.name || tags["name:en"] || tags["name:hi"] || "Medical Centre",
            lat: elLat,
            lon: elLon,
            phone: tags["contact:phone"] || tags["phone"] || tags["mobile"] || null,
            type: tags.amenity === "clinic" ? "Clinic" : "Hospital",
            emergency: tags.emergency === "yes",
            address:
              [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
                .filter(Boolean).join(", ") || null,
          };
        })
        .filter(Boolean);
    } catch (e) {
      console.warn(`[Overpass] ${url} failed:`, e.message);
    }
  }
  return []; // Return empty rather than crash — handled below
}

// ── Main entry point: tries Google → Overpass → shows error ──────────────────
async function fetchNearbyHospitals(lat, lon) {
  console.log(`[Hospitals] Fetching near ${lat.toFixed(4)}, ${lon.toFixed(4)}`);

  // Try Google Places first if key is set
  try {
    const results = await fetchHospitalsGoogle(lat, lon);
    console.log(`[Hospitals] Google returned ${results.length} results`);
    if (results.length > 0) return results;
  } catch (e) {
    console.log(`[Hospitals] Google skipped: ${e.message}`);
  }

  // Fallback: Overpass OSM
  console.log("[Hospitals] Trying Overpass OSM...");
  const results = await fetchHospitalsOverpass(lat, lon);
  console.log(`[Hospitals] Overpass returned ${results.length} results`);

  if (results.length === 0) {
    throw new Error(
      "Could not fetch hospitals. Check internet connection or add a Google Places API key."
    );
  }

  // Deduplicate
  const seen = new Set();
  return results.filter((h) => {
    const key = `${h.name}-${h.lat.toFixed(3)}-${h.lon.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
//fsq3n2TLmSqQrT7k2rnNIe1eP3RhNoWPTExv63ap5hcD/Ts= //