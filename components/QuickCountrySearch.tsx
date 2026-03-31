import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import type { NormalizedPlan } from "../types/plans";
import { iso2ToFlagEmoji } from "../lib/countryFlags";
import { Text } from "./Text";
import { TextInput } from "./TextInput";

type CountryEntry = { iso2: string; name: string; plansCount: number };

type QuickCountrySearchProps = {
  plans: NormalizedPlan[];
  isDark: boolean;
  onSelectCountry: (iso2: string, name: string) => void;
};

export function QuickCountrySearch({ plans, isDark, onSelectCountry }: QuickCountrySearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const countries = useMemo<CountryEntry[]>(() => {
    const map = new Map<string, { name: string; planIds: Set<number> }>();
    for (const plan of plans) {
      for (const country of plan.countries) {
        const iso2 = (country.iso2 ?? "").trim().toUpperCase();
        if (!iso2) continue;
        const existing = map.get(iso2);
        if (existing) {
          existing.planIds.add(plan.id);
        } else {
          map.set(iso2, {
            name: (country.country_name ?? "").trim() || iso2,
            planIds: new Set([plan.id]),
          });
        }
      }
    }
    return Array.from(map.entries())
      .map(([iso2, value]) => ({
        iso2,
        name: value.name,
        plansCount: value.planIds.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries.slice(0, 5);
    return countries
      .filter((country) => country.name.toLowerCase().includes(q) || country.iso2.toLowerCase().includes(q))
      .slice(0, 5);
  }, [countries, query]);

  const open = focused || query.trim().length > 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 220 });
  }, [open, progress]);

  const listAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * 280,
    transform: [{ translateY: (1 - progress.value) * -6 }],
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.textLight]}>Where are you traveling?</Text>
      <View style={[styles.searchWrap, isDark ? styles.searchDark : styles.searchLight]}>
        <Ionicons
          name="search"
          size={18}
          color={isDark ? "rgba(148,163,184,0.85)" : "rgba(100,116,139,0.8)"}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search country"
          placeholderTextColor={isDark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.6)"}
          style={[styles.searchInput, isDark && styles.textLight]}
        />
      </View>
      <Animated.View style={[styles.dropdown, listAnimStyle]}>
        {filtered.map((country) => {
          const flag = iso2ToFlagEmoji(country.iso2) ?? country.iso2;
          return (
            <Pressable
              key={country.iso2}
              onPress={() => onSelectCountry(country.iso2, country.name)}
              style={({ pressed }) => [
                styles.itemRow,
                isDark ? styles.itemRowDark : styles.itemRowLight,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={styles.itemFlag}>{flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, isDark && styles.textLight]}>{country.name}</Text>
                <Text style={[styles.itemMeta, isDark && styles.textMuted]}>
                  {country.plansCount} plan{country.plansCount === 1 ? "" : "s"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? "rgba(148,163,184,0.9)" : "rgba(100,116,139,0.85)"}
              />
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14 },
  title: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 10, paddingHorizontal: 4 },
  searchWrap: {
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  searchDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: { flex: 1, height: 48, fontSize: 14, color: "#0F172A" },
  dropdown: { overflow: "hidden", gap: 8, marginTop: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  itemRowLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  itemRowDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  itemFlag: { fontSize: 24, width: 30, textAlign: "center" },
  itemName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  itemMeta: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  textLight: { color: "#F8FAFC" },
  textMuted: { color: "rgba(148,163,184,0.85)" },
});
