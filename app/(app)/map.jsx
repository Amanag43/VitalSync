// screens/MapScreen.jsx — v4 FINAL
// ✅ Real GPS location • Locate-me button • ETA below safe zone • Premium UI

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Linking, Alert, Animated, Dimensions, Platform,
} from "react-native";
import Mapbox, {
  Camera, MapView, PointAnnotation, ShapeSource, LineLayer, UserLocation,LocationPuck
} from "@rnmapbox/maps";
import * as Location from "expo-location";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MAPBOX_TOKEN = "pk.eyJ1IjoiYW1hbjE1MTgiLCJhIjoiY21taTdoZW01MTNndDJwczYxYmQxaW1lNiJ9.rGfG_eih3BYwE7ODZ4d1GQ";
Mapbox.setAccessToken(MAPBOX_TOKEN);

const { width: SW, height: SH } = Dimensions.get("window");
// Safe area top: notch phones need extra space
const STATUS_H = Platform.OS === "android" ? 28 : 54;
const PANEL_COLLAPSED = 160;
const PANEL_EXPANDED  = SH * 0.54;

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg:       "#0A0E17",
  surface:  "#111827",
  card:     "#1A2235",
  border:   "#1F2D45",
  red:      "#FF3B5C",
  redDim:   "#2B0F1A",
  redGlow:  "#FF3B5C33",
  blue:     "#3B82F6",
  blueDim:  "#0F1F3B",
  green:    "#22C55E",
  greenDim: "#0C2B18",
  text:     "#F0F4FF",
  muted:    "#6B7B9A",
  pill:     "#161D2E",
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dL = ((lat2 - lat1) * Math.PI) / 180, dO = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dO/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
const fmtDist = (km) => km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;
const fmtETA  = (s)  => { const m = Math.ceil(s/60); return m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}m`; };

// ─── STATIC HOSPITALS (worldwide fallback) ────────────────────────────────────
const STATIC_HOSPITALS = [
  // Delhi NCR
  { id:"s1", name:"AIIMS Delhi",                 lat:28.5672, lon:77.2100, phone:"011-26588500", type:"Hospital", emergency:true,  address:"Ansari Nagar, New Delhi" },
  { id:"s2", name:"Safdarjung Hospital",          lat:28.5686, lon:77.2060, phone:"011-26707444", type:"Hospital", emergency:true,  address:"Ansari Nagar West, New Delhi" },
  { id:"s3", name:"Apollo Hospital Delhi",        lat:28.5562, lon:77.2410, phone:"011-71791090", type:"Hospital", emergency:true,  address:"Sarita Vihar, New Delhi" },
  { id:"s4", name:"Sir Ganga Ram Hospital",       lat:28.6395, lon:77.1919, phone:"011-25750000", type:"Hospital", emergency:true,  address:"Rajinder Nagar, New Delhi" },
  { id:"s5", name:"Max Super Speciality Saket",   lat:28.5276, lon:77.2190, phone:"011-26515050", type:"Hospital", emergency:true,  address:"Press Enclave Rd, Saket" },
  { id:"s6", name:"Fortis Vasant Kunj",           lat:28.5211, lon:77.1580, phone:"011-42776222", type:"Hospital", emergency:true,  address:"Vasant Kunj, New Delhi" },
  { id:"s7", name:"BLK-Max Super Speciality",     lat:28.6445, lon:77.1831, phone:"011-30403040", type:"Hospital", emergency:true,  address:"Pusa Road, New Delhi" },
  // Bay Area (dev/emulator)
  { id:"s8", name:"Stanford Hospital",            lat:37.4344, lon:-122.1757,phone:"650-723-4000", type:"Hospital", emergency:true,  address:"300 Pasteur Dr, Stanford CA" },
  { id:"s9", name:"El Camino Health",             lat:37.3786, lon:-122.0531,phone:"650-940-7000", type:"Hospital", emergency:true,  address:"2500 Grant Rd, Mountain View CA" },
  { id:"s10",name:"Kaiser Santa Clara",           lat:37.3541, lon:-121.9552,phone:"408-851-1000", type:"Hospital", emergency:true,  address:"700 Lawrence Expy, Santa Clara CA" },
  // London
  { id:"s11",name:"St Thomas' Hospital",          lat:51.4988, lon:-0.1189,  phone:"020-7188-7188",type:"Hospital", emergency:true,  address:"Westminster Bridge Rd, London" },
];

// ─── FETCH WITH TIMEOUT ───────────────────────────────────────────────────────
async function fetchT(url, opts={}, ms=9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { const r = await fetch(url, {...opts, signal:ctrl.signal}); clearTimeout(t); return r; }
  catch(e) { clearTimeout(t); throw e; }
}


async function fetchNearbyHospitals(lat, lon) {
  try {
    const accessToken = MAPBOX_TOKEN;

    const url =
      `https://api.mapbox.com/search/searchbox/v1/category/hospital` +
      `?proximity=${lon},${lat}` +
      `&limit=10` +
      `&access_token=${accessToken}`;

    const res = await fetch(url);

    const data = await res.json();

    console.log(
      "MAPBOX HOSPITALS:",
      JSON.stringify(data, null, 2)
    );

    return (data.features || []).map(
      (item, index) => ({
        id:
          item.properties?.mapbox_id ||
          String(index),

        name:
          item.properties?.name ||
          "Hospital",

        lat:
          item.geometry?.coordinates?.[1],

        lon:
          item.geometry?.coordinates?.[0],

        type: "Hospital",

        emergency: false,

        address:
          item.properties?.full_address ||
          item.properties?.place_formatted ||
          null,

        phone: null,
      })
    );
  } catch (err) {
    console.error(
      "MAPBOX HOSPITAL ERROR:",
      err
    );

    return [];
  }
}
// ─── ROUTE (OSRM) ─────────────────────────────────────────────────────────────
async function fetchRoute(fLon, fLat, tLon, tLat) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fLon},${fLat};${tLon},${tLat}?overview=full&geometries=geojson`;
  const res = await fetchT(url, {}, 8000);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  const r = json.routes?.[0];
  return r ? { geometry:r.geometry, duration:r.duration, distance:r.distance } : null;
}

// ─── HOSPITAL CARD ────────────────────────────────────────────────────────────
function HospitalCard({ hospital, selected, userLocation, routeInfo, onSelect, onCall, onOpenMaps }) {
  const distKm = userLocation
    ? haversineKm(userLocation.latitude, userLocation.longitude, hospital.lat, hospital.lon)
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.88}
    >
      {/* Top accent bar for selected */}
      {selected && <View style={styles.cardAccent} />}

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, selected && styles.cardIconWrapSelected]}>
          <Text style={styles.cardIcon}>{hospital.type==="Clinic" ? "🏪" : "🏥"}</Text>
        </View>
        <View style={{flex:1, marginLeft:10}}>
          <Text style={styles.cardName} numberOfLines={2}>{hospital.name}</Text>
          <View style={styles.cardMeta}>
            {hospital.emergency && (
              <View style={styles.erBadge}><Text style={styles.erBadgeText}>⚡ ER</Text></View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{hospital.type}</Text>
            </View>
          </View>
        </View>
        {selected && (
          <View style={styles.selectedDot}>
            <View style={styles.selectedDotInner}/>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.cardStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DISTANCE</Text>
          <Text style={[styles.statValue, {color: selected ? C.blue : C.text}]}>
            {distKm!=null ? fmtDist(distKm) : "—"}
          </Text>
        </View>
        <View style={styles.statDivider}/>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DRIVE TIME</Text>
          <Text style={[styles.statValue, {color: selected && routeInfo ? C.red : C.text}]}>
            {selected && routeInfo ? fmtETA(routeInfo.duration) : "—"}
          </Text>
        </View>
        <View style={styles.statDivider}/>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>VIA ROAD</Text>
          <Text style={styles.statValue}>
            {selected && routeInfo ? fmtDist(routeInfo.distance/1000) : "—"}
          </Text>
        </View>
      </View>

      {/* Address */}
      {hospital.address && (
        <Text style={styles.cardAddress} numberOfLines={1}>📍 {hospital.address}</Text>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        {hospital.phone ? (
          <TouchableOpacity style={styles.btnCall} onPress={onCall} activeOpacity={0.8}>
            <Text style={styles.btnCallText}>📞  Call</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.btnCall, styles.btnDisabled]}>
            <Text style={[styles.btnCallText,{opacity:0.3}]}>📞  No number</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btnNav} onPress={onOpenMaps} activeOpacity={0.8}>
          <Text style={styles.btnNavText}>Navigate ↗</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function MapScreen({ route: navRoute }) {
  const alertContext = navRoute?.params?.alertContext;

  const cameraRef  = useRef(null);
  const mapRef     = useRef(null);
  const flatListRef= useRef(null);
  const panelAnim  = useRef(new Animated.Value(PANEL_COLLAPSED)).current;

  const [userLocation,    setUserLocation]    = useState(null);
  const [hospitals,       setHospitals]       = useState([]);
  const [selectedHospital,setSelectedHospital]= useState(null);
  const [routeInfo,       setRouteInfo]       = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [routeLoading,    setRouteLoading]    = useState(false);
  const [panelExpanded,   setPanelExpanded]   = useState(false);
  const [locationError,   setLocationError]   = useState(null);
  const [locating,        setLocating]        = useState(false); // for locate-me btn

  // ── Panel toggle ─────────────────────────────────────────────────────────
  const togglePanel = useCallback(() => {
    const to = panelExpanded ? PANEL_COLLAPSED : PANEL_EXPANDED;
    Animated.spring(panelAnim, { toValue:to, useNativeDriver:false, tension:68, friction:12 }).start();
    setPanelExpanded(p => !p);
  }, [panelExpanded]);

  // ── Select hospital + route ───────────────────────────────────────────────
  const handleSelectHospital = useCallback(async (hospital, ovLat, ovLon) => {
    const lat = ovLat ?? userLocation?.latitude;
    const lon = ovLon ?? userLocation?.longitude;
    if (!lat||!lon) return;

    setSelectedHospital(hospital);
    setRouteInfo(null);
    setRouteLoading(true);

    try {
      const result = await fetchRoute(lon, lat, hospital.lon, hospital.lat);
      if (result) {
        setRouteInfo(result);
        const pad = panelExpanded ? PANEL_EXPANDED+20 : PANEL_COLLAPSED+20;
        cameraRef.current?.fitBounds(
          [Math.min(lon,hospital.lon), Math.min(lat,hospital.lat)],
          [Math.max(lon,hospital.lon), Math.max(lat,hospital.lat)],
          [80, 60, pad, 60], 1200
        );
      }
    } catch(e) { console.warn("Route:", e.message); }
    finally    { setRouteLoading(false); }
  }, [userLocation, panelExpanded]);

  // ── Scroll card into view ─────────────────────────────────────────────────
  const scrollToSelected = useCallback((hospital) => {
    const idx = hospitals.findIndex(h => h.id===hospital.id);
    if (idx>=0 && flatListRef.current)
      flatListRef.current.scrollToIndex({ index:idx, animated:true, viewPosition:0.1 });
  }, [hospitals]);

  // ── LOCATE ME button ─────────────────────────────────────────────────────
  const handleLocateMe = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setUserLocation({ latitude, longitude });
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14,
        animationMode: "flyTo",
        animationDuration: 900,
      });
    } catch(e) {
      console.warn("Locate me:", e.message);
    } finally {
      setLocating(false);
    }
  }, [locating]);

  // ── Init: get location + hospitals ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied. Enable it in Settings.");
          setLoading(false);
          return;
        }

        // FIX: Use HIGH accuracy + watchPosition pattern to get real GPS
        let loc = null;
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,   // ← High, not Balanced
            maximumAge: 5000,                    // accept coords up to 5s old
            timeout: 12000,
          });
        } catch {
          loc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
        }

        if (!loc) {
          setLocationError("Could not get your location. Try again.");
          setLoading(false);
          return;
        }
        if (cancelled) return;

        const { latitude, longitude } = loc.coords;
        console.log(`[Location] Got: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setUserLocation({ latitude, longitude });

        cameraRef.current?.setCamera({
          centerCoordinate: [longitude, latitude],
          zoomLevel: 13,
          animationMode: "flyTo",
          animationDuration: 1200,
        });

        const nearby = await fetchNearbyHospitals(latitude, longitude);
        if (cancelled) return;

        const sorted = nearby.sort((a,b) =>
          haversineKm(latitude,longitude,a.lat,a.lon) - haversineKm(latitude,longitude,b.lat,b.lon)
        );

        setHospitals(sorted);
        setLoading(false);

        if (sorted.length > 0) {
          await handleSelectHospital(sorted[0], latitude, longitude);
          if (alertContext) {
            setTimeout(() => {
              Animated.spring(panelAnim, { toValue:PANEL_EXPANDED, useNativeDriver:false, tension:68, friction:12 }).start();
              setPanelExpanded(true);
            }, 900);
          }
        }
      } catch(e) {
        if (!cancelled) {
          console.error("Init:", e);
          Alert.alert("Error", e.message||"Could not load hospitals.", [{ text:"OK" }]);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const callHospital = (phone) =>
    Linking.openURL(`tel:${phone.replace(/\s+/g,"")}`).catch(() =>
      Alert.alert("Cannot Call", "Dialer not available."));

  const openInGoogleMaps = (h) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}&travelmode=driving`);

  // Safe top for ETA pill — below notch AND below alert banner
  const alertH = alertContext ? (Platform.OS==="android" ? 72 : 88) : 0;
  const etaTop = STATUS_H + alertH + 12;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Alert Banner ── */}
      {alertContext && (
        <View style={styles.alertBanner}>
          <View style={styles.alertPulse}/>
          <View style={{flex:1}}>
            <Text style={styles.alertTitle}>🚨 VITAL ALERT — {alertContext.patientName??"Patient"}</Text>
            <Text style={styles.alertSub}>{alertContext.vital} · Navigating to nearest hospital</Text>
          </View>
        </View>
      )}

      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={
            userLocation
              ? [userLocation.longitude, userLocation.latitude]
              : [77.209, 28.6139]
          }
          animationMode="flyTo"
          animationDuration={1500}
        />

        <UserLocation visible animated renderMode="native"/><LocationPuck visible={true} puckBearing="course"
                                                          />

        {/* Hospital markers */}
        {hospitals.map((h) => {
          const isSel = selectedHospital?.id === h.id;
          return (
            <PointAnnotation
              key={h.id}
              id={`h-${h.id}`}
              coordinate={[h.lon, h.lat]}
              onSelected={() => { handleSelectHospital(h); scrollToSelected(h); if (!panelExpanded) togglePanel(); }}
            >
              <View style={[styles.marker, isSel && styles.markerSelected]}>
                <Text style={[styles.markerEmoji, isSel && {fontSize:20}]}>
                  {h.type==="Clinic"?"🏪":"🏥"}
                </Text>
                {isSel && <View style={styles.markerPulse}/>}
              </View>
            </PointAnnotation>
          );
        })}

        {/* Route line */}
        {routeInfo?.geometry && (
          <ShapeSource id="routeSrc" shape={routeInfo.geometry}>
            <LineLayer id="routeGlow" style={{ lineColor:C.red, lineWidth:14, lineOpacity:0.18, lineCap:"round", lineJoin:"round" }}/>
            <LineLayer id="routeLine" style={{ lineColor:C.red, lineWidth:4.5, lineCap:"round", lineJoin:"round" }}/>
            <LineLayer id="routeDash" style={{ lineColor:"#fff", lineWidth:1.5, lineDasharray:[0,9], lineCap:"round", lineOpacity:0.6 }}/>
          </ShapeSource>
        )}
      </MapView>

      {/* ── ETA Pill — positioned BELOW safe area, NOT behind camera ── */}
      {!loading && selectedHospital && (routeInfo||routeLoading) && (
        <View style={[styles.etaPill, { top: etaTop }]}>
          {routeLoading ? (
            <ActivityIndicator size="small" color={C.red}/>
          ) : (
            <View style={styles.etaInner}>
              <View style={styles.etaBlock}>
                <Text style={styles.etaValue}>{fmtETA(routeInfo.duration)}</Text>
                <Text style={styles.etaLabel}>ETA</Text>
              </View>
              <View style={styles.etaSep}/>
              <View style={styles.etaBlock}>
                <Text style={styles.etaValue}>{fmtDist(routeInfo.distance/1000)}</Text>
                <Text style={styles.etaLabel}>Distance</Text>
              </View>
              <View style={styles.etaSep}/>
              <View style={styles.etaBlock}>
                <Text style={styles.etaValue}>🚗</Text>
                <Text style={styles.etaLabel}>Driving</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Right side FABs ── */}
      <View style={[styles.fabCol, { top: etaTop }]}>
        {/* Locate Me */}
        <TouchableOpacity style={styles.fab} onPress={handleLocateMe} activeOpacity={0.8}>
          {locating
            ? <ActivityIndicator size="small" color={C.blue}/>
            : <Text style={styles.fabIcon}>◎</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Loading Overlay ── */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={C.red}/>
            <Text style={styles.loadingTitle}>Finding hospitals…</Text>
            <Text style={styles.loadingSubtitle}>Searching near your location</Text>
          </View>
        </View>
      )}

      {/* ── Bottom Panel ── */}
      {!loading && hospitals.length > 0 && (
        <Animated.View style={[styles.panel, { height: panelAnim }]}>
          {/* Handle + header */}
          <TouchableOpacity style={styles.panelHeader} onPress={togglePanel} activeOpacity={0.8}>
            <View style={styles.handle}/>
            <View style={styles.panelTitleRow}>
              <View style={styles.panelIconWrap}>
                <Text style={{fontSize:14}}>🏥</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={styles.panelTitle}>
                  {hospitals.length} Hospitals Nearby
                </Text>
                {selectedHospital && (
                  <Text style={styles.panelSub} numberOfLines={1}>
                    Selected: {selectedHospital.name}
                  </Text>
                )}
              </View>
              <View style={styles.chevronWrap}>
                <Text style={styles.chevron}>{panelExpanded ? "▼" : "▲"}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            data={hospitals}
            keyExtractor={h => h.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={SW * 0.78 + 12}
            decelerationRate="fast"
            onScrollToIndexFailed={()=>{}}
            renderItem={({ item }) => (
              <HospitalCard
                hospital={item}
                selected={selectedHospital?.id===item.id}
                userLocation={userLocation}
                routeInfo={selectedHospital?.id===item.id ? routeInfo : null}
                onSelect={() => { handleSelectHospital(item); if (!panelExpanded) togglePanel(); }}
                onCall={() => callHospital(item.phone)}
                onOpenMaps={() => openInGoogleMaps(item)}
              />
            )}
          />
        </Animated.View>
      )}

      {/* ── Empty state ── */}
      {!loading && hospitals.length===0 && !locationError && (
        <View style={styles.emptyPanel}>
          <View style={styles.handle}/>
          <Text style={styles.panelTitle}>No hospitals found nearby</Text>
          <Text style={styles.emptyText}>Try opening Google Maps for a broader search.</Text>
          <TouchableOpacity
            style={styles.btnOpenMapsLarge}
            onPress={() => Linking.openURL("https://www.google.com/maps/search/hospital+near+me")}
          >
            <Text style={styles.btnOpenMapsLargeText}>Search in Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Location error ── */}
      {locationError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:C.bg },
  map: { flex:1 },

  // Alert
  alertBanner: {
    backgroundColor:C.red, flexDirection:"row", alignItems:"center",
    paddingHorizontal:16, paddingVertical:10,
    paddingTop: Platform.OS==="android" ? 34 : 52,
    zIndex:20, gap:12,
  },
  alertPulse: { width:8, height:8, borderRadius:4, backgroundColor:"#fff", opacity:0.9 },
  alertTitle: { color:"#fff", fontWeight:"800", fontSize:13, letterSpacing:0.3 },
  alertSub:   { color:"rgba(255,255,255,0.8)", fontSize:11, marginTop:2 },

  // ETA Pill — left side, below safe area
  etaPill: {
    position:"absolute",
    left:16,
    backgroundColor:C.pill,
    borderRadius:16,
    borderWidth:1,
    borderColor:C.border,
    overflow:"hidden",
    elevation:10,
    shadowColor:"#000",
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.6,
    shadowRadius:10,
    minWidth:52,
    minHeight:52,
    justifyContent:"center",
    alignItems:"center",
    paddingHorizontal:4,
    paddingVertical:6,
  },
  etaInner:  { flexDirection:"row", alignItems:"center" },
  etaBlock:  { alignItems:"center", paddingHorizontal:12, paddingVertical:4 },
  etaValue:  { color:C.text, fontWeight:"700", fontSize:14 },
  etaLabel:  { color:C.muted, fontSize:10, marginTop:2, letterSpacing:0.5 },
  etaSep:    { width:1, height:32, backgroundColor:C.border },

  // FABs — right side column
  fabCol: {
    position:"absolute",
    right:14,
    gap:10,
  },
  fab: {
    width:46,
    height:46,
    borderRadius:23,
    backgroundColor:C.surface,
    borderWidth:1,
    borderColor:C.border,
    justifyContent:"center",
    alignItems:"center",
    elevation:8,
    shadowColor:"#000",
    shadowOffset:{width:0,height:3},
    shadowOpacity:0.5,
    shadowRadius:8,
  },
  fabIcon: { fontSize:22, color:C.blue },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:"rgba(10,14,23,0.88)",
    justifyContent:"center",
    alignItems:"center",
  },
  loadingCard: {
    backgroundColor:C.surface,
    borderRadius:20,
    padding:28,
    alignItems:"center",
    borderWidth:1,
    borderColor:C.border,
    gap:10,
    minWidth:220,
  },
  loadingTitle:    { color:C.text,  fontSize:16, fontWeight:"700", marginTop:4 },
  loadingSubtitle: { color:C.muted, fontSize:13 },

  // Markers
  marker: {
    backgroundColor:C.surface, borderRadius:22, padding:7,
    borderWidth:2, borderColor:C.border,
    elevation:6, shadowColor:"#000",
    shadowOffset:{width:0,height:3}, shadowOpacity:0.5, shadowRadius:6,
  },
  markerSelected: { borderColor:C.red, backgroundColor:C.redDim, transform:[{scale:1.2}] },
  markerEmoji:    { fontSize:18 },
  markerPulse: {
    position:"absolute", top:-8, left:-8, right:-8, bottom:-8,
    borderRadius:34, borderWidth:2, borderColor:C.red, opacity:0.4,
  },

  // Panel
  panel: {
    position:"absolute", bottom:0, left:0, right:0,
    backgroundColor:C.surface,
    borderTopLeftRadius:24, borderTopRightRadius:24,
    borderTopWidth:1, borderColor:C.border,
    overflow:"hidden", elevation:30,
    shadowColor:"#000", shadowOffset:{width:0,height:-8},
    shadowOpacity:0.6, shadowRadius:20,
  },
  panelHeader: { paddingTop:8, paddingBottom:8 },
  handle: {
    width:40, height:4, borderRadius:2,
    backgroundColor:C.border,
    alignSelf:"center", marginBottom:10,
    marginTop:6,
  },
  panelTitleRow: {
    flexDirection:"row", alignItems:"center",
    paddingHorizontal:16, gap:10,
  },
  panelIconWrap: {
    width:36, height:36, borderRadius:10,
    backgroundColor:C.redDim,
    justifyContent:"center", alignItems:"center",
    borderWidth:1, borderColor:C.red+"44",
  },
  panelTitle: { color:C.text, fontWeight:"700", fontSize:14 },
  panelSub:   { color:C.muted, fontSize:11, marginTop:1 },
  chevronWrap: {
    width:28, height:28, borderRadius:14,
    backgroundColor:C.card,
    justifyContent:"center", alignItems:"center",
  },
  chevron: { color:C.muted, fontSize:10 },
  listContent: { paddingHorizontal:14, paddingBottom:20, paddingTop:4 },

  // Hospital card
  card: {
    width: SW * 0.78,
    backgroundColor:C.card,
    borderRadius:18,
    padding:14,
    marginRight:12,
    borderWidth:1.5,
    borderColor:C.border,
    overflow:"hidden",
  },
  cardSelected: { borderColor:C.red, backgroundColor:"#151D30" },
  cardAccent: { position:"absolute", top:0, left:0, right:0, height:3, backgroundColor:C.red },
  cardHeader: { flexDirection:"row", alignItems:"flex-start", marginBottom:12 },
  cardIconWrap: {
    width:46, height:46, borderRadius:13,
    backgroundColor:C.redDim,
    justifyContent:"center", alignItems:"center",
    borderWidth:1, borderColor:C.red+"44",
  },
  cardIconWrapSelected: { backgroundColor:C.blueDim, borderColor:C.blue+"44" },
  cardIcon: { fontSize:22 },
  cardName: { color:C.text, fontWeight:"700", fontSize:14, lineHeight:19 },
  cardMeta: { flexDirection:"row", alignItems:"center", gap:6, marginTop:4, flexWrap:"wrap" },
  erBadge: {
    backgroundColor:C.red, borderRadius:5,
    paddingHorizontal:6, paddingVertical:2,
  },
  erBadgeText: { color:"#fff", fontSize:9, fontWeight:"800", letterSpacing:0.5 },
  typeBadge: {
    backgroundColor:C.border, borderRadius:5,
    paddingHorizontal:6, paddingVertical:2,
  },
  typeBadgeText: { color:C.muted, fontSize:9, fontWeight:"600" },
  selectedDot: {
    width:20, height:20, borderRadius:10,
    borderWidth:2, borderColor:C.red,
    justifyContent:"center", alignItems:"center",
    marginLeft:6,
  },
  selectedDotInner: { width:8, height:8, borderRadius:4, backgroundColor:C.red },

  cardStats: {
    flexDirection:"row",
    backgroundColor:C.bg,
    borderRadius:12,
    paddingVertical:10,
    marginBottom:10,
    borderWidth:1,
    borderColor:C.border,
  },
  statBox:     { flex:1, alignItems:"center" },
  statDivider: { width:1, backgroundColor:C.border },
  statLabel:   { color:C.muted, fontSize:9, fontWeight:"700", letterSpacing:0.9, marginBottom:4 },
  statValue:   { color:C.text, fontWeight:"700", fontSize:15 },

  cardAddress: { color:C.muted, fontSize:11, marginBottom:10 },

  cardActions: { flexDirection:"row", gap:8 },
  btnCall: {
    flex:1, backgroundColor:C.greenDim,
    borderWidth:1, borderColor:C.green+"44",
    borderRadius:11, paddingVertical:10, alignItems:"center",
  },
  btnDisabled: { backgroundColor:C.border+"22", borderColor:C.border },
  btnCallText: { color:C.green, fontWeight:"700", fontSize:13 },
  btnNav: {
    flex:1.4, backgroundColor:C.red,
    borderRadius:11, paddingVertical:10, alignItems:"center",
  },
  btnNavText: { color:"#fff", fontWeight:"700", fontSize:13 },

  // Empty
  emptyPanel: {
    position:"absolute", bottom:0, left:0, right:0,
    backgroundColor:C.surface,
    borderTopLeftRadius:24, borderTopRightRadius:24,
    borderTopWidth:1, borderColor:C.border,
    paddingBottom:34, paddingTop:12, elevation:30,
  },
  emptyText: { color:C.muted, fontSize:13, paddingHorizontal:20, marginBottom:16, marginTop:4 },
  btnOpenMapsLarge: {
    marginHorizontal:16, backgroundColor:C.red,
    borderRadius:14, paddingVertical:14, alignItems:"center",
  },
  btnOpenMapsLargeText: { color:"#fff", fontWeight:"700", fontSize:14 },

  // Error
  errorBanner: {
    position:"absolute", bottom:30, left:20, right:20,
    backgroundColor:C.redDim, borderRadius:14,
    padding:14, borderWidth:1, borderColor:C.red,
  },
  errorText: { color:C.red, fontSize:13, fontWeight:"600", textAlign:"center" },
});