import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      hydrated: false,

      setAuth: (token, user) =>
        set({
          token,
          user,
          isLoggedIn: true,
        }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          isLoggedIn: false,
          hydrated: true, // 👈 IMPORTANT
        }),

      setHydrated: () =>
        set({
          hydrated: true,
        }),
      getUserId: () => {
              const user = get().user;
              return user?.id || user?.user_id || null;
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
    },
  ),
);
