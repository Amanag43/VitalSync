import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return <Redirect href={isLoggedIn ? "/home" : "/login"} />;
}