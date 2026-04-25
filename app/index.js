import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrated = useAuthStore((s) => s.hydrated);

  console.log("INDEX:", { isLoggedIn, hydrated });

  // ⛔ WAIT until store loads
  if (!hydrated) return null;

  return <Redirect href={isLoggedIn ? "/home" : "/login"} />;
}