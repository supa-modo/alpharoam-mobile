import React, { useMemo } from "react";
import { ImageBackground, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { NormalizedPlan } from "../types/plans";
import { getTopPlanCountries } from "../lib/topPlanCountries";
import { iso2ToFlagEmoji } from "../lib/countryFlags";
import { Text } from "./Text";

type Destination = {
  iso2: string;
  name: string;
  plansCount: number;
  colors: [string, string];
  imageSource: number | null;
};

type PopularDestinationsProps = {
  plans: NormalizedPlan[];
  isDark: boolean;
  onSelectCountry: (iso2: string, name: string) => void;
  onPrefetchCountry?: (iso2: string, name: string) => void;
};

const DESTINATION_COLORS: [string, string][] = [
  ["#FDF2F8", "#FCE7F3"],
  ["#FFF7ED", "#FFEDD5"],
  ["#ECFEFF", "#CFFAFE"],
  ["#EEF2FF", "#E0E7FF"],
  ["#F0FDF4", "#DCFCE7"],
  ["#FEF9C3", "#FEF08A"],
];

const DESTINATION_IMAGE_SOURCE: Record<string, number> = {
  // Add real local images in `assets/images/destinations` and uncomment as available.
  // Example:
  AU: require("../assets/images/destinations/au.jpg"),
  EG: require("../assets/images/destinations/eg.jpg"),
  TR: require("../assets/images/destinations/tr.jpg"),
  IL: require("../assets/images/destinations/il.jpg"),
  MO: require("../assets/images/destinations/mo.jpg"),
  MA: require("../assets/images/destinations/eg.jpg"),
};

export function PopularDestinations({
  plans,
  isDark,
  onSelectCountry,
  onPrefetchCountry,
}: PopularDestinationsProps) {
  const destinations = useMemo(() => {
    return getTopPlanCountries(plans, 6).map((d, i) => ({
      ...d,
      colors: DESTINATION_COLORS[i % DESTINATION_COLORS.length],
      imageSource: DESTINATION_IMAGE_SOURCE[d.iso2] ?? null,
    }));
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
              onPressIn={() => onPrefetchCountry?.(destination.iso2, destination.name)}
              onPress={() => onSelectCountry(destination.iso2, destination.name)}
              style={({ pressed }) => [
                styles.cardWrap,
                isDark ? styles.cardWrapDark : styles.cardWrapLight,
                pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 },
              ]}
            >
              <View style={styles.cardMask}>
                {destination.imageSource ? (
                  <ImageBackground
                    source={destination.imageSource}
                    resizeMode="cover"
                    {...(Platform.OS === "android" ? { resizeMethod: "resize" as const } : {})}
                    imageStyle={styles.cardImage}
                    style={styles.card}
                  >
                    <Text style={styles.flagOnImage}>{flag}</Text>
                    <LinearGradient
                      colors={["rgba(2,6,23,0)", "rgba(2,6,23,0.46)", "rgba(2,6,23,0.82)"]}
                      start={{ x: 0.5, y: 0.1 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.overlayBottom}
                    />
                    <View style={styles.bottomOverlay}>
                      <Text style={styles.countryOnImage} numberOfLines={1}>
                        {destination.name}
                      </Text>
                      <Text style={styles.metaOnImage}>
                        {destination.plansCount} plan{destination.plansCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </ImageBackground>
                ) : (
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
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 3, overflow: "visible" },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    paddingHorizontal: 22,
  },
  row: { gap: 14, paddingHorizontal: 22, paddingBottom: 14 },
  cardWrap: {
    borderRadius: 24,
  },
  cardWrapLight: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 7,
  },
  cardWrapDark: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 9,
  },
  cardMask: {
    borderRadius: 24,
    overflow: "hidden",
  },
  card: {
    width: 176,
    height: 220,
    borderRadius: 24,
    padding: 12,
    justifyContent: "space-between",
  },
  cardImage: { borderRadius: 24 },
  flag: { fontSize: 28, textAlign: "right" },
  flagOnImage: {
    fontSize: 25,
    textAlign: "right",
    zIndex: 2,
    textShadowColor: "rgba(2,6,23,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottom: { gap: 4 },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    zIndex: 1,
  },
  bottomOverlay: { gap: 2, zIndex: 2, marginTop: "auto" },
  country: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  countryOnImage: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
    textShadowColor: "rgba(2,6,23,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  meta: { fontSize: 11, fontWeight: "700", color: "#475569" },
  metaOnImage: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(241,245,249,0.96)",
    textShadowColor: "rgba(2,6,23,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textLight: { color: "#F8FAFC" },
  textMuted: { color: "rgba(226,232,240,0.9)" },
});
