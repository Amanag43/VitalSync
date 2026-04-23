import { sendVitals } from "../services/apiService";
import { getVitals } from "../services/healthService";
import { useAuthStore } from "../store/authStore";
import { useHealthStore } from "../store/healthStore";

export const runHealthEngine = async () => {
  const vitals = await getVitals();

  if (!vitals) return;

  const userId = useAuthStore.getState().getUserId();
  const setVitals = useHealthStore.getState().setVitals;

  if (!userId) return;

  setVitals(vitals);

  await sendVitals({
    userId,
    ...vitals,
  });
};
