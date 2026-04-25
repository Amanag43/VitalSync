import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      hydrated: false,

      // ✅ SET AUTH (Firebase user)
      setAuth: (_, user) =>
        set({
          user,
          isLoggedIn: true,
        }),

      // ✅ CLEAR AUTH
      clearAuth: () =>
        set({
          user: null,
          isLoggedIn: false,
          hydrated: true,
        }),

      // ✅ HYDRATION FLAG
      setHydrated: () =>
        set({
          hydrated: true,
        }),

      // ✅ GET USER ID (VERY IMPORTANT)
      getUserId: () => {
        const user = get().user;
        return user?.id || null;
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