import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../src/components/AppButton";
import AppInput from "../../src/components/AppInput";
import { theme } from "../../src/theme/theme";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://192.168.1.16/iotjacket-api-php/api/v1/auth/signup.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        },
      );

      const json = await res.json();

      if (!json.success) {
        Alert.alert("Signup Failed", json.message);
        return;
      }

      Alert.alert("✅ Success", "Account created");
      router.replace("/(auth)/login");
    } catch (e) {
      Alert.alert("Error", "Server not reachable");
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
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Ionicons
              name="person-add"
              size={24}
              color={theme.colors.primary}
            />
          </View>

          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>
            Join the safest IoT health tracking
          </Text>
        </View>

        {/* Glass Card */}
        <View style={styles.card}>
          <AppInput
            label="Full Name"
            placeholder="Aman Agarwal"
            value={name}
            onChangeText={setName}
          />

          <AppInput
            label="Email"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passWrap}>
              <View style={{ flex: 1 }}>
                <AppInput
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
              </View>

              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPass((p) => !p)}
              >
                <Ionicons
                  name={showPass ? "eye-off" : "eye"}
                  size={18}
                  color={theme.colors.muted}
                />
              </Pressable>
            </View>
          </View>

          <AppButton
            title={loading ? "Creating..." : "Sign Up"}
            onPress={handleSignup}
            disabled={loading}
          />

          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.link}>
              Already have an account?{" "}
              <Text style={styles.linkBold}>Login</Text>
            </Text>
          </Pressable>

          <Text style={styles.terms}>
            Creating an account means you accept our{" "}
            <Text style={styles.termsBold}>Terms</Text>.
          </Text>
        </View>
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
    top: -140,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.22)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -160,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(220,38,38,0.10)",
  },

  brand: {
    alignItems: "center",
    marginBottom: 18,
  },

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
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.2,
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

  inputLabel: {
    color: theme.colors.muted,
    fontWeight: "800",
    marginBottom: 6,
    fontSize: 12,
  },

  passWrap: {
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

  link: {
    textAlign: "center",
    marginTop: 14,
    color: theme.colors.muted,
    fontWeight: "700",
  },

  linkBold: {
    color: theme.colors.primary,
    fontWeight: "900",
  },

  terms: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  termsBold: {
    color: theme.colors.text,
    fontWeight: "900",
  },
});

