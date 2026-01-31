export function getPrimaryAid(reason) {
  switch (reason) {
    case "LOW_SPO2":
      return {
        title: "Low Oxygen Level",
        steps: [
          "Sit or lie down comfortably",
          "Loosen tight clothing",
          "Breathe slowly and deeply",
          "If oxygen cylinder available, use immediately",
          "Avoid physical movement",
        ],
      };

    case "HIGH_PULSE":
      return {
        title: "Abnormal Heart Rate",
        steps: [
          "Sit down and rest immediately",
          "Avoid exertion or panic",
          "Take slow deep breaths",
          "Check if chest pain or dizziness exists",
          "Seek medical help urgently",
        ],
      };

    case "HIGH_TEMP":
      return {
        title: "High Body Temperature",
        steps: [
          "Move to a cool place",
          "Remove excess clothing",
          "Drink water if conscious",
          "Apply cold compress on forehead",
          "Avoid alcohol or caffeine",
        ],
      };

    case "LOW_BATTERY":
      return {
        title: "Device Battery Low",
        steps: [
          "Connect charger immediately",
          "Keep device powered on",
          "Avoid restarting device",
          "Ensure SOS remains active",
        ],
      };

    case "LOW_SIGNAL":
      return {
        title: "Weak Signal Detected",
        steps: [
          "Move to open area",
          "Avoid enclosed spaces",
          "Keep phone nearby",
          "Do not turn off device",
        ],
      };

    case "DEVICE OFFLINE":
      return {
        title: "Device Offline",
        steps: [
          "Check jacket power",
          "Ensure internet connectivity",
          "Restart device if safe",
          "Seek help manually if needed",
        ],
      };

    default:
      return {
        title: "Emergency Condition",
        steps: [
          "Stay calm",
          "Avoid movement",
          "Follow medical assistance",
          "Wait for emergency services",
        ],
      };
  }
}
