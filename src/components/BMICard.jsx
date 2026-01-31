import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";
import { calculateBMI, getBMIStatus } from "../utils/bmi";

export default function BMICard({ weight, height }) {
  const bmi = calculateBMI(weight, height);
  if (!bmi) return null;

  const status = getBMIStatus(bmi);
  if (!status) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="body" size={18} color={status.color} />
        <Text style={styles.title}>BMI</Text>
      </View>

      <Text style={[styles.bmiValue, { color: status.color }]}>{bmi}</Text>

      <Text style={styles.status}>
        {status.label} • Risk: {status.risk}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },
  bmiValue: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "900",
  },
  status: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
});
