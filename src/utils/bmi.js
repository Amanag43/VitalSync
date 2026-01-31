export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  return Number(bmi.toFixed(1));
}

export function getBMIStatus(bmi) {
  if (!bmi) return null;

  if (bmi < 18.5)
    return { label: "Underweight", color: "#F59E0B", risk: "Medium" };

  if (bmi < 25) return { label: "Normal", color: "#16A34A", risk: "Low" };

  if (bmi < 30)
    return { label: "Overweight", color: "#F97316", risk: "Medium" };

  return { label: "Obese", color: "#DC2626", risk: "High" };
}
