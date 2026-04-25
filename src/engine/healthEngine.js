import { sendVitals } from "../services/apiService";
import { getVitals } from "../services/healthService";
import { useAuthStore } from "../store/authStore";
import { useHealthStore } from "../store/healthStore";

export const runHealthEngine = async () => {
  try {
    // ✅ 1. Get vitals safely
    let vitals = null;

    try {
      vitals = await getVitals();
    } catch (err) {
      console.log("getVitals error:", err.message);
      return;
    }

    if (!vitals) return;

    // ✅ 2. Get user safely
    const store = useAuthStore.getState();
    const userId = store?.getUserId?.();

    if (!userId) {
      console.log("No userId");
      return;
    }

    // ✅ 3. Update global state safely
    try {
      const healthStore = useHealthStore.getState();
      healthStore?.setVitals?.(vitals);
    } catch (err) {
      console.log("setVitals error:", err.message);
    }

    // ✅ 4. Send to backend safely
    try {
      await sendVitals({
        userId,
        ...vitals,
      });
    } catch (err) {
      console.log("sendVitals error:", err.message);
    }

  } catch (err) {
    console.log("Health Engine Crash Prevented:", err.message);
  }
};