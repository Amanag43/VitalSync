import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      hydrated: false,

      // setAuth — first param was _ (thrown away). Now accepts (uid, userObj) or just (userObj).
      // We also always ensure .uid is stored so getUserId works regardless of how it's called.
      setAuth: (uidOrUser, userObj) => {
        // Support two call patterns:
        //   setAuth(null, { id: uid, email })   ← your current login screen
        //   setAuth({ uid, email })              ← future Firebase direct pass
        const resolved =
          userObj ??
          (typeof uidOrUser === "object" ? uidOrUser : null);

        if (!resolved) {
          console.warn("[AuthStore] setAuth called with no user object");
          return;
        }

        // Normalise: always store both .id and .uid so nothing breaks
        const normalised = {
          ...resolved,
          id:  resolved.id  ?? resolved.uid ?? null,
          uid: resolved.uid ?? resolved.id  ?? null,
        };

        console.log("[AuthStore] setAuth → userId:", normalised.id);
        set({ user: normalised, isLoggedIn: true });
      },

      clearAuth: () =>
        set({ user: null, isLoggedIn: false }),

      setHydrated: () =>
        set({ hydrated: true }),

      // Returns the Firebase UID or null
      getUserId: () => {
        const user = get().user;
        // Check .id first (your current pattern), then .uid as fallback
        return user?.id ?? user?.uid ?? null;
      },
    }),

    {
      name: "auth-storage",
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);