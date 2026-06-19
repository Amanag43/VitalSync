import { initGoogleFit, readLatestVitals } from "../services/googleFit";

export async function startAlertEngine(userId) {
  useVitalsStore.getState().setUserId(userId);
  useVitalsStore.getState().connectWebSocket(userId);

  const { available, reason } = await initGoogleFit();

  if (!available) {
    console.warn("[AlertEngine] Google Fit unavailable:", reason);
    return { googleFitAvailable: false, reason };
  }

  // Start polling
  startVitalsPolling((vitals) => {
    useVitalsStore.getState().updateVitals(vitals);
  }, 15000);

  return { googleFitAvailable: true };
}