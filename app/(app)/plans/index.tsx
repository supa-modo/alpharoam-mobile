import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { Text } from "../../../components/Text";
import { TextInput } from "../../../components/TextInput";
import { AuthenticatedScreenWrapper } from "../../../components/AuthenticatedScreenWrapper";
import { fetchPlans } from "../../../services/plans";
import { iso2ToFlagEmoji } from "../../../lib/countryFlags";
import type { AlphaRoamCountry, NormalizedPlan } from "../../../types/plans";

type CountryRow = {
  iso2: string;
  name: string;
  plansCount: number;
};

function buildCountries(plans: NormalizedPlan[]): CountryRow[] {
  const map = new Map<string, { country: AlphaRoamCountry; planIds: Set<number> }>();
  for (const plan of plans) {
    for (const country of plan.countries) {
      const key = (country.iso2 || country.country_code || country.country_name).trim();
      if (!key) continue;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { country, planIds: new Set([plan.id]) });
      } else {
        existing.planIds.add(plan.id);
      }
    }
  }

  return Array.from(map.values())
    .map((entry) => ({
      iso2: entry.country.iso2,
      name: entry.country.country_name,
      plansCount: entry.planIds.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [region, setRegion] = useState<string>("All regions");

  const {
    data: plans,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["alpharoam", "plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10,
  });

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const plan of plans ?? []) {
      const r = (plan.region ?? "").trim();
      if (r) set.add(r);
    }
    return ["All regions", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [plans]);

  const plansForRegion = useMemo(() => {
    if (!plans) return [];
    if (region === "All regions") return plans;
    return plans.filter((p) => (p.region ?? "").trim() === region);
  }, [plans, region]);

  const countries = useMemo(() => buildCountries(plansForRegion), [plansForRegion]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q));
  }, [countries, query]);

  return (
    <AuthenticatedScreenWrapper>
      <ScrollView
        style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, isDark && styles.textMutedDark]}>AVAILABLE DESTINATIONS</Text>
            <Text style={[styles.title, isDark && styles.textLight]}>Browse plans</Text>
            <Text style={[styles.subtitle, isDark && styles.textMutedDark]}>
              Pick a country to see available eSIM data plans.
            </Text>
          </View>
          <Pressable
            onPress={() => refetch()}
            style={[styles.iconBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
          >
            {isFetching ? (
              <ActivityIndicator size="small" color={isDark ? "#93C5FD" : "#2563EB"} />
            ) : (
              <Ionicons name="refresh" size={18} color={isDark ? "#93C5FD" : "#2563EB"} />
            )}
          </Pressable>
        </View>

        <View
          style={[
            styles.searchFieldWrap,
            isDark ? styles.searchFieldDark : styles.searchFieldLight,
            searchFocused && (isDark ? styles.searchFieldFocusedDark : styles.searchFieldFocusedLight),
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={
              searchFocused
                ? "#2563EB"
                : isDark
                  ? "rgba(148,163,184,0.75)"
                  : "rgba(100,116,139,0.7)"
            }
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search 190+ countries"
            placeholderTextColor={
              isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.55)"
            }
            style={[styles.searchFieldInput, isDark && styles.textLight]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={12} style={styles.searchClearBtn}>
              <View style={isDark ? styles.searchClearInnerDark : styles.searchClearInnerLight}>
                <Ionicons
                  name="close"
                  size={12}
                  color={isDark ? "rgba(148,163,184,0.95)" : "rgba(71,85,105,0.9)"}
                />
              </View>
            </Pressable>
          ) : null}
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
                className="border border-gray-300"
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
          <Animated.View entering={FadeIn.duration(180)} style={styles.listWrap}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <View
                key={`skeleton-${idx}`}
                className="border border-gray-300"
                style={[
                  styles.row,
                  styles.skeletonRow,
                  isDark ? styles.skeletonRowDark : styles.skeletonRowLight,
                  idx < 5 && styles.rowSpacing,
                ]}
              >
                <View style={[styles.skeletonFlag, isDark && styles.skeletonMutedDark]} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={[styles.skeletonLineWide, isDark && styles.skeletonMutedDark]} />
                  <View style={[styles.skeletonLineShort, isDark && styles.skeletonMutedDark]} />
                </View>
                <ActivityIndicator size="small" color={isDark ? "#93C5FD" : "#2563EB"} />
              </View>
            ))}
            <Text style={[styles.loadingText, isDark && styles.textMutedDark]}>
              Loading available destinations...
            </Text>
          </Animated.View>
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
            <Pressable className="flex flex-row items-center gap-2 " onPress={() => refetch()} style={styles.retryBtn}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex flex-col gap-3" style={styles.listWrap}>
            {filtered.map((country, index) => {
              const flagEmoji = iso2ToFlagEmoji(country.iso2);
              const isLast = index === filtered.length - 1;
              return (
                <Pressable
                  key={country.iso2}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/plans/country/[iso2]" as const,
                      params: { iso2: country.iso2, name: country.name },
                    })
                  }
                  className="border border-gray-300"
                  style={({ pressed }) => [
                    styles.row,
                    isDark ? styles.cardDark : styles.cardLight,
                    !isLast && styles.rowSpacing,
                    pressed && (isDark ? styles.rowPressedDark : styles.rowPressedLight),
                  ]}
                >
                  {flagEmoji ? (
                    <Text style={styles.flagEmoji}>{flagEmoji}</Text>
                  ) : (
                    <View style={styles.flagCircle}>
                      <Text style={styles.flagText}>{country.iso2.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.countryName, isDark && styles.textLight]}>
                      {country.name}
                    </Text>
                    <Text style={[styles.countryMeta, isDark && styles.textMutedDark]}>
                      {country.plansCount} plan{country.plansCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isDark ? "rgba(148,163,184,0.8)" : "rgba(100,116,139,0.8)"}
                  />
                </Pressable>
              );
            })}

            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  No countries match your search.
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </AuthenticatedScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F1F5F9" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.8)" },

  header: {
    paddingHorizontal: 22,
    marginBottom: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#64748B",
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: "500", lineHeight: 17 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnLight: { backgroundColor: "rgba(37,99,235,0.10)" },
  iconBtnDark: { backgroundColor: "rgba(147,197,253,0.12)" },

  /** Matches QuickCountrySearch search field for design consistency */
  searchFieldWrap: {
    marginHorizontal: 22,
    marginBottom: 16,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchFieldLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#9ca3af",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchFieldDark: {
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  searchFieldFocusedLight: {
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  searchFieldFocusedDark: {
    borderColor: "rgba(59,130,246,0.55)",
  },
  searchFieldInput: {
    flex: 1,
    height: 43,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  searchClearBtn: { padding: 2 },
  searchClearInnerLight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchClearInnerDark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(148,163,184,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  regionRow: {
    paddingHorizontal: 22,
    paddingBottom: 12,
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

  listWrap: {
    paddingHorizontal: 22,
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rowSpacing: { marginBottom: 12 },
  rowPressedLight: {
    backgroundColor: "#EEF2FF",
  },
  rowPressedDark: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  flagCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  flagText: { fontSize: 11, fontWeight: "800", color: "#1D4ED8" },
  flagEmoji: {
    width: 44,
    textAlign: "center",
    fontSize: 28,
    lineHeight: 32,
  },
  countryName: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  countryMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },

  emptyWrap: { paddingTop: 30, alignItems: "center" },
  emptyText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  skeletonRow: { minHeight: 76 },
  skeletonRowLight: { backgroundColor: "#FFFFFF" },
  skeletonRowDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  skeletonMutedDark: { backgroundColor: "rgba(148,163,184,0.2)" },
  skeletonFlag: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(100,116,139,0.18)",
  },
  skeletonLineWide: {
    width: "70%",
    height: 12,
    borderRadius: 7,
    backgroundColor: "rgba(100,116,139,0.18)",
  },
  skeletonLineShort: {
    width: "45%",
    height: 10,
    borderRadius: 7,
    backgroundColor: "rgba(100,116,139,0.14)",
  },

  cardLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});
