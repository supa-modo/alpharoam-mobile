import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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

const DROPDOWN_OFFSET_Y = Platform.select({
  ios: 10,
  android: 6,
  default: 8,
});

export function QuickCountrySearch({ plans, isDark, onSelectCountry }: QuickCountrySearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const searchWrapRef = useRef<View>(null);
  const isOpen = focused || query.trim().length > 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, { duration: 180 });
  }, [isOpen, progress]);

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
      .map(([iso2, { name, planIds }]) => ({
        iso2,
        name,
        plansCount: planIds.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plans]);

  const filtered = useMemo<CountryEntry[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries.slice(0, 6);
    return countries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso2.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [countries, query]);

  const refreshAnchor = useCallback(() => {
    if (!searchWrapRef.current) return;
    searchWrapRef.current.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  }, []);

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -6 }],
  }));

  const handleSelect = useCallback(
    (iso2: string, name: string) => {
      Keyboard.dismiss();
      setFocused(false);
      setQuery("");
      onSelectCountry(iso2, name);
    },
    [onSelectCountry]
  );

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);
  const closeDropdown = useCallback(() => {
    Keyboard.dismiss();
    setFocused(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.textLight]}>
        Where are you traveling?
      </Text>

      <View
        ref={searchWrapRef}
        onLayout={refreshAnchor}
        style={[
          styles.searchWrap,
          isDark ? styles.searchDark : styles.searchLight,
          focused && (isDark ? styles.searchFocusedDark : styles.searchFocusedLight),
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={
            focused
              ? "#2563EB"
              : isDark
                ? "rgba(148,163,184,0.75)"
                : "rgba(100,116,139,0.7)"
          }
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            setFocused(true);
            refreshAnchor();
          }}
          onBlur={() => setFocused(false)}
          placeholder="Search 190+ countries"
          placeholderTextColor={
            isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.55)"
          }
          style={[styles.searchInput, isDark && styles.textLight]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={12} style={styles.clearBtn}>
            <View style={isDark ? styles.clearBtnInnerDark : styles.clearBtnInnerLight}>
              <Ionicons
                name="close"
                size={12}
                color={isDark ? "rgba(148,163,184,0.95)" : "rgba(71,85,105,0.9)"}
              />
            </View>
          </Pressable>
        ) : null}
      </View>

      <Modal transparent visible={isOpen} onRequestClose={closeDropdown} animationType="none">
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeDropdown} />
          <Animated.View
            style={[
              styles.dropdown,
              isDark ? styles.dropdownDark : styles.dropdownLight,
              {
                top: anchor.y + anchor.height + DROPDOWN_OFFSET_Y,
                left: anchor.x,
                width: anchor.width,
              },
              dropdownStyle,
            ]}
          >
            <View style={[styles.dropdownHeader, isDark ? styles.dividerDark : styles.dividerLight]}>
              <Text style={[styles.dropdownTitle, isDark && styles.textLight]}>Popular countries</Text>
              <Pressable onPress={closeDropdown} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={16} color={isDark ? "#cbd5e1" : "#334155"} />
              </Pressable>
            </View>
            <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
              {filtered.length > 0 ? (
                filtered.map((country, index) => {
                  const flag = iso2ToFlagEmoji(country.iso2) ?? country.iso2;
                  const isLast = index === filtered.length - 1;
                  return (
                    <Pressable
                      key={country.iso2}
                      onPress={() => handleSelect(country.iso2, country.name)}
                      style={({ pressed }) => [
                        styles.itemRow,
                        !isLast && (isDark ? styles.dividerDark : styles.dividerLight),
                        pressed && styles.itemPressed,
                      ]}
                    >
                      <Text style={styles.itemFlag}>{flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, isDark && styles.textLight]}>{country.name}</Text>
                        <Text style={[styles.itemMeta, isDark && styles.textMuted]}>
                          {country.plansCount} plan{country.plansCount === 1 ? "" : "s"} available
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={isDark ? "rgba(148,163,184,0.9)" : "rgba(100,116,139,0.9)"}
                      />
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyRow}>
                  <Ionicons
                    name="earth-outline"
                    size={22}
                    color={isDark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.4)"}
                  />
                  <Text style={[styles.emptyText, isDark && styles.textMuted]}>No countries found</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14 },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  searchWrap: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchDark: {
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.09)",
  },
  searchFocusedLight: {
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  searchFocusedDark: {
    borderColor: "rgba(59,130,246,0.55)",
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  clearBtn: { padding: 2 },
  clearBtnInnerLight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnInnerDark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(148,163,184,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalRoot: { ...StyleSheet.absoluteFillObject },
  backdrop: { ...StyleSheet.absoluteFillObject },
  dropdown: {
    position: "absolute",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: 300,
    zIndex: 9999,
  },
  dropdownLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownDark: {
    backgroundColor: "rgba(15,23,42,0.97)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 14,
  },
  dropdownHeader: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownList: { maxHeight: 256 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  itemPressed: {
    backgroundColor: "rgba(37,99,235,0.05)",
  },
  dividerLight: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(15,23,42,0.08)",
  },
  dividerDark: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.15)",
  },
  itemFlag: { fontSize: 26, width: 34, textAlign: "center" },
  itemName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  itemMeta: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 1 },
  emptyRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: { fontSize: 13, fontWeight: "600", color: "#64748B" },

  textLight: { color: "#F8FAFC" },
  textMuted: { color: "rgba(148,163,184,0.85)" },
});