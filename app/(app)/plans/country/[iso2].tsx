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
import { TextInput } from "../../../../components/TextInput";
import { fetchPlans } from "../../../../services/plans";
import type { NormalizedPlan } from "../../../../types/plans";

function formatPlanMeta(plan: NormalizedPlan) {
  const parts: string[] = [];
  if (plan.dataGb !== null) parts.push(`${plan.dataGb}GB`);
  if (plan.validityDays !== null) parts.push(`${plan.validityDays} days`);
  if (plan.planType) parts.push(plan.planType);
  return parts.join(" • ");
}

export default function CountryPlansScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams<{ iso2: string; name?: string }>();
  const iso2 = (params.iso2 ?? "").toString();
  const countryName = (params.name ?? iso2.toUpperCase()).toString();

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("All regions");

  const { data: plans, isLoading, error, refetch } = useQuery({
    queryKey: ["alpharoam", "plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10,
  });

  const countryPlansRaw = useMemo(() => {
    return (plans ?? []).filter((p) =>
      p.countries.some((c) => (c.iso2 ?? "").toLowerCase() === iso2.toLowerCase())
    );
  }, [plans, iso2]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const plan of countryPlansRaw) {
      const r = (plan.region ?? "").trim();
      if (r) set.add(r);
    }
    return ["All regions", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [countryPlansRaw]);

  const countryPlansByRegion = useMemo(() => {
    if (region === "All regions") return countryPlansRaw;
    return countryPlansRaw.filter((p) => (p.region ?? "").trim() === region);
  }, [countryPlansRaw, region]);

  const countryPlans = useMemo(() => {
    const list = countryPlansByRegion;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q));
  }, [countryPlansByRegion, query]);

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
          style={[styles.backBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
        >
          <Ionicons name="arrow-back" size={18} color={isDark ? "#E2E8F0" : "#0F172A"} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1}>
            {countryName}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMutedDark]} numberOfLines={1}>
            Choose a plan to view details and checkout.
          </Text>
        </View>

        <Pressable
          onPress={() => refetch()}
          style={[styles.backBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
        >
          <Ionicons name="refresh" size={18} color={isDark ? "#93C5FD" : "#2563EB"} />
        </Pressable>
      </View>

      <View
        style={[
          styles.searchWrap,
          isDark ? { backgroundColor: "rgba(148,163,184,0.10)" } : { backgroundColor: "rgba(15,23,42,0.04)" },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={isDark ? "rgba(148,163,184,0.8)" : "rgba(100,116,139,0.8)"}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search plans"
          placeholderTextColor={isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)"}
          style={[styles.searchInput, isDark && { color: "#F8FAFC" }]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.regionRow}
      >
        {regions.map((r) => {
          const active = r === region;
          return (
            <Pressable
              key={r}
              onPress={() => setRegion(r)}
              style={[
                styles.regionChip,
                isDark ? styles.regionChipDark : styles.regionChipLight,
                active && styles.regionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.regionChipText,
                  isDark && { color: "#E2E8F0" },
                  active && { color: "#2563EB" },
                ]}
              >
                {r}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading && !plans ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.loadingText, isDark && styles.textMutedDark]}>
            Loading plans...
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
            Couldn&apos;t load plans
          </Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {countryPlans.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() =>
                router.push({
                  pathname: "/(app)/plans/plan/[id]" as const,
                  params: { id: String(plan.id), iso2, name: countryName },
                })
              }
              style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.planName, isDark && styles.textLight]} numberOfLines={2}>
                  {plan.name}
                </Text>
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>
                    {plan.priceUsd !== null ? `$${plan.priceUsd}` : "—"}
                  </Text>
                </View>
              </View>

              <Text style={[styles.planMeta, isDark && styles.textMutedDark]} numberOfLines={2}>
                {formatPlanMeta(plan)}
              </Text>

              <View style={styles.cardBottom}>
                <Text style={[styles.region, isDark && styles.textMutedDark]} numberOfLines={1}>
                  {plan.region}
                </Text>
                <View style={styles.detailsHint}>
                  <Text style={[styles.detailsHintText, isDark && styles.textLight]}>
                    View details
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={isDark ? "#E2E8F0" : "#0F172A"} />
                </View>
              </View>
            </Pressable>
          ))}

          {countryPlans.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                No plans found for your search.
              </Text>
            </View>
          ) : null}
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
  backBtn: {
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

  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,
  },
  searchInput: { flex: 1, height: 46, fontSize: 14, color: "#0F172A" },

  regionRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  regionChipLight: {
    backgroundColor: "rgba(15,23,42,0.05)",
  },
  regionChipDark: {
    backgroundColor: "rgba(148,163,184,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  regionChipActive: {
    backgroundColor: "rgba(37,99,235,0.12)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.35)",
  },
  regionChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },

  center: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  loadingText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  errorTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  retryBtn: { marginTop: 6, backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  listWrap: { paddingHorizontal: 16, gap: 10 },
  card: { borderRadius: 18, padding: 14 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  planName: { fontSize: 14, fontWeight: "800", color: "#0F172A", flex: 1 },
  pricePill: { backgroundColor: "rgba(37,99,235,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  priceText: { color: "#1D4ED8", fontWeight: "800", fontSize: 12 },
  planMeta: { marginTop: 8, fontSize: 12, color: "#64748B" },
  cardBottom: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  region: { fontSize: 11, color: "#94A3B8", fontWeight: "700" },
  detailsHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailsHintText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },

  emptyWrap: { paddingTop: 30, alignItems: "center" },
  emptyText: { fontSize: 12, color: "#64748B", fontWeight: "600" },

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
