import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../src/theme/theme";

import * as Haptics from "expo-haptics";
import AnimatedCard from "../../src/components/AnimatedCard";
import AppInput from "../../src/components/AppInput";
import PressableScale from "../../src/components/PressableScale";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Error", "All fields are required");

    try {
      setLoading(true);
      await Haptics.selectionAsync();
      await signInWithEmailAndPassword(auth, email, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* Glow BG */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {/* Brand */}
        <AnimatedCard>
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Ionicons
                name="shield-checkmark"
                size={26}
                color={theme.colors.primary}
              />
            </View>

            <Text style={styles.appName}>Ninfet Smart Textile</Text>
            <Text style={styles.tagline}>Health • SOS • Live Tracking</Text>
          </View>
        </AnimatedCard>

        {/* Glass Card */}
        <AnimatedCard>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subTitle}>
              Login to continue monitoring safely
            </Text>

            <AppInput
              label="Email"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Password toggle */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
              </View>

              <PressableScale
                onPress={() => setShowPass((p) => !p)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? "eye-off" : "eye"}
                  size={18}
                  color={theme.colors.muted}
                />
              </PressableScale>
            </View>

            {/* Login Button */}
            <PressableScale
              disabled={loading}
              onPress={handleLogin}
              style={[styles.mainBtn, { opacity: loading ? 0.7 : 1 }]}
            >
              <Text style={styles.mainBtnText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </PressableScale>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Placeholder */}
            <PressableScale
              onPress={() =>
                Alert.alert("Google Login", "We will enable Google later ✅")
              }
              style={styles.googleBtn}
            >
              <Ionicons
                name="logo-google"
                size={16}
                color={theme.colors.text}
              />
              <Text style={styles.googleText}>Continue with Google</Text>
            </PressableScale>

            {/* Signup */}
            <PressableScale
              onPress={() => router.push("/(auth)/signup")}
              style={{ marginTop: 14 }}
            >
              <Text style={styles.link}>
                Don’t have an account?{" "}
                <Text style={styles.linkBold}>Sign up</Text>
              </Text>
            </PressableScale>

            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsBold}>Terms</Text> &{" "}
              <Text style={styles.termsBold}>Privacy Policy</Text>.
            </Text>
          </View>
        </AnimatedCard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
    justifyContent: "center",
  },

  glowTop: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.22)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -140,
    right: -90,
    width: 290,
    height: 290,
    borderRadius: 999,
    backgroundColor: "rgba(22,163,74,0.10)",
  },

  brand: { alignItems: "center", marginBottom: 18 },

  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  appName: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  tagline: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  card: {
    backgroundColor: "rgba(17,26,46,0.92)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
  },

  title: { color: theme.colors.text, fontSize: 20, fontWeight: "900" },

  subTitle: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 14,
  },

  inputLabel: {
    color: theme.colors.muted,
    fontWeight: "800",
    marginBottom: 6,
    fontSize: 12,
  },

  passRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  eyeBtn: {
    width: 46,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },

  mainBtn: {
    marginTop: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  mainBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 14,
  },

  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },

  dividerText: {
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },

  googleBtn: {
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  googleText: { color: theme.colors.text, fontWeight: "900" },

  link: {
    textAlign: "center",
    color: theme.colors.muted,
    fontWeight: "700",
  },

  linkBold: { color: theme.colors.primary, fontWeight: "900" },

  terms: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  termsBold: { color: theme.colors.text, fontWeight: "900" },
});
