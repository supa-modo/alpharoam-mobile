import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../../../../components/Text";
import { fetchPlans } from "../../../../services/plans";
import { usePlansStore } from "../../../../store/plansStore";
import type { NormalizedPlan } from "../../../../types/plans";

function formatPrice(priceUsd: number | null) {
  return priceUsd !== null ? `$${priceUsd}` : "—";
}

function formatMeta(plan: NormalizedPlan) {
  const parts: string[] = [];
  if (plan.dataGb !== null) parts.push(`${plan.dataGb}GB`);
  if (plan.validityDays !== null) parts.push(`${plan.validityDays} days`);
  if (plan.planType) parts.push(plan.planType);
  return parts.join(" • ");
}

export default function PlanDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const params = useLocalSearchParams<{ id: string; iso2?: string; name?: string }>();
  const id = Number(params.id);
  const countryIso2 = (params.iso2 ?? "").toString();
  const countryName = (params.name ?? "").toString();

  const selectPlan = usePlansStore((s) => s.selectPlan);
  const [selecting, setSelecting] = useState(false);

  const { data: plans, isLoading, error, refetch } = useQuery({
    queryKey: ["alpharoam", "plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10,
  });

  const plan = useMemo(() => (plans ?? []).find((p) => p.id === id) ?? null, [plans, id]);

  const handleSelect = async () => {
    if (!plan) return;
    setSelecting(true);
    try {
      selectPlan({
        plan,
        countryIso2: countryIso2 || (plan.countries[0]?.iso2 ?? ""),
        countryName: countryName || (plan.countries[0]?.country_name ?? "Selected country"),
      });
      router.push("/(app)/checkout");
    } finally {
      setSelecting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
      contentContainerStyle={{
        paddingTop: insets.top + 10,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
        >
          <Ionicons name="arrow-back" size={18} color={isDark ? "#E2E8F0" : "#0F172A"} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1}>
            Plan details
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMutedDark]} numberOfLines={1}>
            {countryName ? `${countryName} • ` : ""}{countryIso2 ? countryIso2.toUpperCase() : ""}
          </Text>
        </View>
        <Pressable
          onPress={() => refetch()}
          style={[styles.iconBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
        >
          <Ionicons name="refresh" size={18} color={isDark ? "#93C5FD" : "#2563EB"} />
        </Pressable>
      </View>

      {isLoading && !plans ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.loadingText, isDark && styles.textMutedDark]}>
            Loading plan...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={isDark ? "rgba(148,163,184,0.55)" : "rgba(100,116,139,0.55)"}
          />
          <Text style={[styles.errorTitle, isDark && styles.textLight]}>
            Couldn&apos;t load plan
          </Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !plan ? (
        <View style={styles.center}>
          <Text style={[styles.errorTitle, isDark && styles.textLight]}>
            Plan not found
          </Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.cardTop}>
              <Text style={[styles.planName, isDark && styles.textLight]}>
                {plan.name}
              </Text>
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{formatPrice(plan.priceUsd)}</Text>
              </View>
            </View>
            <Text style={[styles.meta, isDark && styles.textMutedDark]}>
              {formatMeta(plan)}
            </Text>
            <Text style={[styles.region, isDark && styles.textMutedDark]}>
              {plan.region}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>What you get</Text>
            <Text style={[styles.details, isDark && styles.textMutedDark]}>
              {plan.detailsText || "No additional details provided."}
            </Text>
          </View>

          <Pressable
            onPress={handleSelect}
            disabled={selecting}
            style={({ pressed }) => [
              styles.cta,
              pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
              selecting && { opacity: 0.7 },
            ]}
          >
            {selecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>Select plan</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F8FAFC" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.7)" },

  topBar: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnLight: { backgroundColor: "rgba(15,23,42,0.06)" },
  iconBtnDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  title: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },

  center: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  loadingText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  errorTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  retryBtn: { marginTop: 6, backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  content: { paddingHorizontal: 16, gap: 14 },
  card: { borderRadius: 18, padding: 14 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  planName: { fontSize: 16, fontWeight: "900", color: "#0F172A", flex: 1 },
  pricePill: { backgroundColor: "rgba(37,99,235,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  priceText: { color: "#1D4ED8", fontWeight: "900", fontSize: 12 },
  meta: { marginTop: 8, fontSize: 12, color: "#64748B", fontWeight: "700" },
  region: { marginTop: 6, fontSize: 12, color: "#94A3B8", fontWeight: "700" },

  section: { paddingHorizontal: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  details: { fontSize: 13, color: "#64748B", lineHeight: 20 },

  cta: {
    marginTop: 6,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  cardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});

