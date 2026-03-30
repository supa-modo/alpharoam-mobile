import React, { useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "../../components/Text";
import { useAuthStore } from "../../store/authStore";
import { router } from "expo-router";
import { getTimeGreeting } from "../../lib/greeting";

const STAT_CARDS = [
  { title: "Active eSIM", value: "1", subtitle: "US + Europe" },
  { title: "Data remaining", value: "3.2 GB", subtitle: "Renews in 7 days" },
  { title: "Coverage", value: "190+", subtitle: "Countries" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((state) => state.user);

  const greeting = useMemo(() => getTimeGreeting(), []);
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  const dataProgress = 0.68;

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(380)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greetingLine, isDark && styles.textMutedDark]}>
            {greeting}, {firstName}
          </Text>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>
            Roam without limits
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={[
              styles.headerIconBtn,
              isDark ? styles.headerIconBtnDark : styles.headerIconBtnLight,
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={isDark ? "#94A3B8" : "#475569"} />
            <View style={[styles.notifDot, isDark && { borderColor: "#020617" }]} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.heroWrap}>
        <LinearGradient
          colors={["#1E3FAE", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroCircleSm} />

          <View style={styles.heroTopRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandDots}>
                <View style={[styles.brandDot, { backgroundColor: "#F43F5E" }]} />
                <View style={[styles.brandDotOverlap, { backgroundColor: "#FBBF24" }]} />
              </View>
              <Text style={styles.brandWord}>AlphaRoam</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="cellular-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroPillText}>eSIM ready</Text>
            </View>
          </View>

          <Text style={styles.heroEyebrow}>Global data</Text>
          <Text style={styles.heroHeadline}>
            Stay connected anywhere you land
          </Text>
          <Text style={styles.heroSub}>
            Activate in minutes. Keep your number. Travel like a local.
          </Text>

          <Pressable style={styles.heroCta} onPress={() => router.push("/(app)/plans")}>
            <Text style={styles.heroCtaText}>Browse plans</Text>
            <Ionicons name="arrow-forward" size={16} color="#0F172A" />
          </Pressable>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
        <Text style={[styles.sectionKicker, isDark && styles.textMutedDark]}>QUICK ACTIONS</Text>
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push("/(app)/plans")}
            style={({ pressed }) => [pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
          >
            <View style={[styles.quickPill, isDark ? styles.quickPillDark : styles.quickPillLight]}>
              <View style={styles.quickIconWrap}>
                <MaterialCommunityIcons name="earth" size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.quickLabel, isDark && { color: "#E2E8F0" }]} numberOfLines={2}>
                Buy data
              </Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [pressed && { opacity: 0.88 }]}>
            <View style={[styles.quickPill, isDark ? styles.quickPillDark : styles.quickPillLight]}>
              <View style={styles.quickIconWrap}>
                <MaterialCommunityIcons name="flash-outline" size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.quickLabel, isDark && { color: "#E2E8F0" }]} numberOfLines={2}>
                Top up
              </Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [pressed && { opacity: 0.88 }]}>
            <View style={[styles.quickPill, isDark ? styles.quickPillDark : styles.quickPillLight]}>
              <View style={styles.quickIconWrap}>
                <MaterialCommunityIcons name="qrcode-scan" size={22} color="#10B981" />
              </View>
              <Text style={[styles.quickLabel, isDark && { color: "#E2E8F0" }]} numberOfLines={2}>
                Scan eSIM
              </Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.section}>
        <View style={styles.sectionHeadRow}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Your usage</Text>
          <Text style={[styles.sectionHint, isDark && styles.textMutedDark]}>Demo snapshot</Text>
        </View>
        <View style={[styles.usageCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.usageTop}>
            <Text style={[styles.usageLabel, isDark && styles.textMutedDark]}>Data this cycle</Text>
            <Text style={[styles.usagePct, isDark && styles.textLight]}>{Math.round(dataProgress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#3B82F6", "#60A5FA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.max(dataProgress * 100, 4)}%` }]}
            />
          </View>
          <Text style={[styles.usageCaption, isDark && styles.textMutedDark]}>
            On track — plenty of buffer before renewal.
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(180)} style={styles.section}>
        <Text style={[styles.sectionKicker, isDark && styles.textMutedDark]}>CURRENT PLAN</Text>
        <View style={styles.statRow}>
          {STAT_CARDS.map((card) => (
            <View
              key={card.title}
              style={[styles.statTile, isDark ? styles.cardDark : styles.cardLight]}
            >
              <Text style={[styles.statTitle, isDark && styles.textMutedDark]} numberOfLines={2}>
                {card.title}
              </Text>
              <Text style={[styles.statValue, isDark && styles.textLight]} numberOfLines={1}>
                {card.value}
              </Text>
              <Text style={[styles.statSubtitle, isDark && styles.textMutedDark]} numberOfLines={2}>
                {card.subtitle}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F1F5F9" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.8)" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  greetingLine: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.45,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerIconBtnLight: { backgroundColor: "rgba(15,23,42,0.06)" },
  headerIconBtnDark: { backgroundColor: "rgba(255,255,255,0.07)" },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },

  heroWrap: {
    marginHorizontal: 20,
    marginBottom: 22,
    borderRadius: 28,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 26,
    elevation: 14,
  },
  heroCard: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    overflow: "hidden",
    minHeight: 220,
  },
  heroCircle1: {
    position: "absolute",
    top: -64,
    right: -44,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircle2: {
    position: "absolute",
    bottom: -60,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroCircleSm: {
    position: "absolute",
    top: 36,
    right: 72,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDots: { flexDirection: "row", alignItems: "center" },
  brandDot: { width: 26, height: 26, borderRadius: 13 },
  brandDotOverlap: { width: 26, height: 26, borderRadius: 13, marginLeft: -12 },
  brandWord: { fontSize: 14, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.2 },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroPillText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.35,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 320,
  },
  heroCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  heroCtaText: { color: "#0F172A", fontSize: 13, fontWeight: "800" },

  section: { paddingHorizontal: 22, marginBottom: 22 },
  sectionKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#64748B",
    marginBottom: 12,
  },
  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  sectionHint: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },

  quickRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  quickPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 999,
    minWidth: 0,
  },
  quickPillLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  quickPillDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickIconWrap: { alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "700", color: "#475569", textAlign: "center" },

  usageCard: { borderRadius: 20, padding: 18 },
  usageTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  usageLabel: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  usagePct: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(148,163,184,0.22)",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: { height: 8, borderRadius: 4 },
  usageCaption: { fontSize: 12, fontWeight: "500", color: "#64748B" },

  statRow: { flexDirection: "row", gap: 10 },
  statTile: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    minWidth: 0,
  },
  statTitle: { fontSize: 10, fontWeight: "700", color: "#64748B", letterSpacing: 0.2 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  statSubtitle: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },

  cardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});
