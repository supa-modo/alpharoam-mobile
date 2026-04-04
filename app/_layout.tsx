import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { GOOGLE_SANS_FLEX_24PT_REQUIRES } from "../constants/typography";
import { PLANS_QUERY_KEY, plansCatalogQueryOptions } from "../lib/plansQuery";
import { readValidCachedPlans } from "../lib/plansDiskCache";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const queryClient = new QueryClient();

function PlansCatalogBootstrap() {
  const qc = useQueryClient();
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fromDisk = await readValidCachedPlans();
        if (!cancelled && fromDisk?.length) {
          qc.setQueryData(PLANS_QUERY_KEY, fromDisk);
        }
      } finally {
        if (!cancelled) {
          void qc.prefetchQuery({ ...plansCatalogQueryOptions });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qc]);
  return null;
}

function RootLayoutNav() {
  const [hydrated, setHydrated] = useState(false);
  const [themeHydrated, setThemeHydrated] = useState(false);

  const [fontsLoaded] = useFonts(GOOGLE_SANS_FLEX_24PT_REQUIRES);

  useEffect(() => {
    useAuthStore.getState().hydrate().then(() => setHydrated(true));
    useThemeStore.getState().hydrate().then(() => setThemeHydrated(true));
  }, []);

  useEffect(() => {
    if (
      !hydrated ||
      !useAuthStore.getState().isReady ||
      !themeHydrated ||
      !fontsLoaded
    ) {
      return;
    }
    SplashScreen.hideAsync();
  }, [hydrated, themeHydrated, fontsLoaded]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PlansCatalogBootstrap />
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
