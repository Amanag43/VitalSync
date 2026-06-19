// app/(app)/health-diagnostic.jsx
// DIAGNOSTIC SCREEN — manually test Health Connect step by step

import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import {
  initHealthConnect,
  requestHealthPermissions,
  readLatestVitals,
} from "../../src/services/healthConnect";

const C = { bg: "#0A0E17", card: "#111827", text: "#F0F4FF", red: "#FF3B5C", green: "#22C55E", blue: "#3B82F6", muted: "#6B7B9A" };

export default function HealthDiagnosticScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const log = (msg, color = C.text) => {
    console.log("[DIAG]", msg);
    setLogs((prev) => [{ msg, color, t: new Date().toLocaleTimeString() }, ...prev.slice(0, 30)]);
  };

  // ── Test 1: Initialize ───────────────────────────────────────────────
  const test1_init = async () => {
    setLoading(true);
    log("TEST 1: Initializing Health Connect...", C.blue);
    try {
      const { available, reason } = await initHealthConnect();
      if (available) {
        log("✅ HC initialized successfully", C.green);
        log(`   Status: ${reason || "Available"}`, C.green);
      } else {
        log(`❌ HC init failed: ${reason}`, C.red);
      }
    } catch (e) {
      log(`❌ ERROR: ${e.message}`, C.red);
    }
    setLoading(false);
  };

  // ── Test 2: Request permissions (with debugging) ──────────────────────
  const test2_requestPerms = async () => {
    setLoading(true);
    log("TEST 2: Requesting HC permissions...", C.blue);
    log("   A dialog SHOULD appear on your device now.", C.muted);
    log("   Watch your device screen carefully.", C.muted);

    try {
      const granted = await requestHealthPermissions();
      if (granted) {
        log("✅ Permissions GRANTED!", C.green);
      } else {
        log("❌ Permissions DENIED or dialog didn't appear", C.red);
        log("   → Check if a dialog appeared on device", C.muted);
        log("   → Did you tap [Allow]?", C.muted);
        log("   → Did the dialog appear off-screen?", C.muted);
      }
    } catch (e) {
      log(`❌ EXCEPTION: ${e.message}`, C.red);
    }
    setLoading(false);
  };

  // ── Test 3: Try to read vitals (requires permissions) ────────────────
  const test3_readVitals = async () => {
    setLoading(true);
    log("TEST 3: Reading vitals from Health Connect...", C.blue);
    log("   This will ONLY work if permissions are granted", C.muted);

    try {
      const vitals = await readLatestVitals(60); // last 60 minutes
      if (vitals) {
        log("✅ Successfully read vitals!", C.green);
        Object.entries(vitals).forEach(([key, val]) => {
          log(`   ${key}: ${val.value} ${val.unit}`, C.green);
        });
      } else {
        log("⚠️  No vitals found in last 60 minutes", C.muted);
        log("   → Health Connect might have no data", C.muted);
        log("   → Or your device isn't syncing health data", C.muted);
      }
    } catch (e) {
      log(`❌ Read failed: ${e.message}`, C.red);
      if (e.message.includes("SecurityException")) {
        log("   → Permissions are DENIED", C.red);
        log("   → Go back to Test 2 and grant permissions", C.red);
      }
    }
    setLoading(false);
  };

  // ── Test 4: Check device health data ─────────────────────────────────
  const test4_checkHealthApp = async () => {
    setLoading(true);
    log("TEST 4: Checking if device has health data...", C.blue);
    log("   Opening Health Connect app settings...", C.muted);

    try {
      // Try to open HC settings
      const { openHealthConnectSettings } = await import("react-native-health-connect");
      await openHealthConnectSettings();
      log("✅ Opened Health Connect app", C.green);
      log("   Check if you have any connected devices or data", C.muted);
    } catch (e) {
      log(`❌ Could not open HC: ${e.message}`, C.red);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={s.title}>🔬 HC Diagnostic Tests</Text>
      <Text style={s.subtitle}>Run these tests IN ORDER</Text>

      {/* Test buttons */}
      <View style={s.testRow}>
        <TouchableOpacity style={[s.btn, { borderColor: C.blue + "88" }]} onPress={test1_init} disabled={loading}>
          <Text style={[s.btnText, { color: C.blue }]}>Test 1: Init HC</Text>
        </TouchableOpacity>
      </View>

      <View style={s.testRow}>
        <TouchableOpacity style={[s.btn, { borderColor: C.green + "88" }]} onPress={test2_requestPerms} disabled={loading}>
          {loading ? <ActivityIndicator color={C.green} /> : <Text style={[s.btnText, { color: C.green }]}>Test 2: Request Permissions</Text>}
        </TouchableOpacity>
        <Text style={s.note}>⚠️  Watch your device screen!</Text>
      </View>

      <View style={s.testRow}>
        <TouchableOpacity style={[s.btn, { borderColor: C.blue + "88" }]} onPress={test3_readVitals} disabled={loading}>
          <Text style={[s.btnText, { color: C.blue }]}>Test 3: Read Vitals</Text>
        </TouchableOpacity>
      </View>

      <View style={s.testRow}>
        <TouchableOpacity style={[s.btn, { borderColor: C.muted + "88" }]} onPress={test4_checkHealthApp} disabled={loading}>
          <Text style={[s.btnText, { color: C.muted }]}>Test 4: Open HC App</Text>
        </TouchableOpacity>
      </View>

      {/* Log */}
      <View style={s.card}>
        <Text style={s.cardTitle}>EVENT LOG</Text>
        {logs.length === 0 ? (
          <Text style={s.empty}>No events yet. Tap a test above.</Text>
        ) : (
          logs.map((l, i) => (
            <View key={i} style={s.logRow}>
              <Text style={s.logTime}>{l.t}</Text>
              <Text style={[s.logMsg, { color: l.color }]}>{l.msg}</Text>
            </View>
          ))
        )}
      </View>

      {/* Instructions */}
      <View style={s.card}>
        <Text style={s.cardTitle}>WHAT TO DO</Text>
        <Text style={s.instruction}>1️⃣  Tap "Test 1: Init HC" — should say ✅ Available</Text>
        <Text style={s.instruction}>2️⃣  Tap "Test 2: Request Permissions"</Text>
        <Text style={s.instruction}>   → A dialog MUST appear asking for permissions</Text>
        <Text style={s.instruction}>   → If NO dialog appears, that's the bug</Text>
        <Text style={s.instruction}>   → Tap [Allow] to grant</Text>
        <Text style={s.instruction}>3️⃣  Tap "Test 3: Read Vitals"</Text>
        <Text style={s.instruction}>   → Should show your recent health data</Text>
        <Text style={s.instruction}>4️⃣  If Test 3 fails with permission error:</Text>
        <Text style={s.instruction}>   → Tap "Test 4: Open HC App"</Text>
        <Text style={s.instruction}>   → Manually grant permissions in HC app</Text>
        <Text style={s.instruction}>   → Come back and tap Test 3 again</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: 60 },
  title:        { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle:     { color: C.muted, fontSize: 12, marginBottom: 20 },
  testRow:      { marginBottom: 12 },
  btn:          { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  btnText:      { fontSize: 13, fontWeight: "700" },
  note:         { color: C.red, fontSize: 11, marginTop: 6 },
  card:         { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: C.muted + "33" },
  cardTitle:    { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 },
  logRow:       { flexDirection: "row", gap: 8, paddingVertical: 3 },
  logTime:      { color: C.muted, fontSize: 11, minWidth: 55 },
  logMsg:       { fontSize: 12, flex: 1 },
  empty:        { color: C.muted, fontSize: 13 },
  instruction: { color: C.text, fontSize: 12, lineHeight: 20, marginBottom: 8 },
});