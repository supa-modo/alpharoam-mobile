import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { NormalizedPlan } from "../types/plans";
import { iso2ToFlagEmoji } from "../lib/countryFlags";
import { Text } from "./Text";

type Destination = {
  iso2: string;
  name: string;
  plansCount: number;
  colors: [string, string];
};

type PopularDestinationsProps = {
  plans: NormalizedPlan[];
  isDark: boolean;
  onSelectCountry: (iso2: string, name: string) => void;
};

const DESTINATION_COLORS: [string, string][] = [
  ["#FDF2F8", "#FCE7F3"],
  ["#FFF7ED", "#FFEDD5"],
  ["#ECFEFF", "#CFFAFE"],
  ["#EEF2FF", "#E0E7FF"],
  ["#F0FDF4", "#DCFCE7"],
  ["#FEF9C3", "#FEF08A"],
];

export function PopularDestinations({ plans, isDark, onSelectCountry }: PopularDestinationsProps) {
  const destinations = useMemo(() => {
    const map = new Map<string, { name: string; plans: Set<number> }>();
    for (const plan of plans) {
      for (const country of plan.countries) {
        const iso2 = (country.iso2 ?? "").trim().toUpperCase();
        if (!iso2) continue;
        const name = (country.country_name ?? "").trim();
        const existing = map.get(iso2);
        if (existing) {
          existing.plans.add(plan.id);
        } else {
          map.set(iso2, { name, plans: new Set([plan.id]) });
        }
      }
    }

    return Array.from(map.entries())
      .map(([iso2, value], i) => ({
        iso2,
        name: value.name || iso2,
        plansCount: value.plans.size,
        colors: DESTINATION_COLORS[i % DESTINATION_COLORS.length],
      }))
      .sort((a, b) => b.plansCount - a.plansCount)
      .slice(0, 6);
  }, [plans]);

  if (destinations.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.textLight]}>Popular destinations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {destinations.map((destination) => {
          const flag = iso2ToFlagEmoji(destination.iso2) ?? destination.iso2;
          return (
            <Pressable
              key={destination.iso2}
              onPress={() => onSelectCountry(destination.iso2, destination.name)}
              style={({ pressed }) => [styles.cardWrap, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(59,130,246,0.22)", "rgba(30,41,59,0.6)"]
                    : destination.colors
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <Text style={styles.flag}>{flag}</Text>
                <View style={styles.bottom}>
                  <Text style={[styles.country, isDark && styles.textLight]} numberOfLines={1}>
                    {destination.name}
                  </Text>
                  <Text style={[styles.meta, isDark && styles.textMuted]}>
                    {destination.plansCount} plan{destination.plansCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 18 },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  row: { gap: 12, paddingHorizontal: 4, paddingBottom: 2 },
  cardWrap: {
    borderRadius: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    width: 162,
    height: 182,
    borderRadius: 20,
    padding: 14,
    justifyContent: "space-between",
  },
  flag: { fontSize: 30, textAlign: "right" },
  bottom: { gap: 4 },
  country: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  meta: { fontSize: 11, fontWeight: "700", color: "#475569" },
  textLight: { color: "#F8FAFC" },
  textMuted: { color: "rgba(226,232,240,0.9)" },
});
