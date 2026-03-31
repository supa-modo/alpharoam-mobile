import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert, Image, StatusBar, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { Text } from "../../components/Text";
import { useAuthStore } from "../../store/authStore";
import { usePlansStore } from "../../store/plansStore";
import { router } from "expo-router";
import { getTimeGreeting } from "../../lib/greeting";
import { fetchPlans } from "../../services/plans";
import { QuickCountrySearch } from "../../components/QuickCountrySearch";
import { PopularDestinations } from "../../components/PopularDestinations";
import type { NormalizedPlan } from "../../types/plans";

const QUICK_ACTIONS = [
  {
    label: "Buy Data",
    sub: "Browse plans",
    icon: "earth",
    color: "#3b53f6",
    bg: "rgba(37,99,235,1)",
    borderColor: "#2546b3",
    action: "plans",
  },
  {
    label: "Top Up",
    sub: "Add credit",
    icon: "flash-outline",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,1)",
    borderColor: "#6d38b0",
    action: "topup",
  },
  {
    label: "Scan eSIM",
    sub: "QR activate",
    icon: "qrcode-scan",
    color: "#10B981",
    bg: "rgba(16,185,129,1)",
    borderColor: "#0e7456",
    action: "profile",
  },
  {
    label: "Support",
    sub: "Contact us",
    icon: "headset",
    color: "#F59E0B",
    bg: "rgba(245,158,11,1)",
    borderColor: "#b84e00",
    action: "support",
  },
] as const;

const TRUST_POINTS = [
  {
    icon: "flash-outline",
    title: "Instant activation",
    subtitle: "Get online in minutes after checkout.",
  },
  {
    icon: "earth-outline",
    title: "190+ countries",
    subtitle: "One app for regional and global travel.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "No hidden fees",
    subtitle: "Simple pricing with transparent checkout.",
  },
] as const;

function formatPlanMeta(plan: NormalizedPlan) {
  const pieces: string[] = [];
  if (plan.dataGb !== null) pieces.push(`${plan.dataGb}GB`);
  if (plan.validityDays !== null) pieces.push(`${plan.validityDays} days`);
  if (plan.planType) pieces.push(plan.planType);
  return pieces.join(" • ") || "Plan details available after activation";
}

function getExpiryLabel(expiryIso: string | null) {
  if (!expiryIso) return "Valid plan";
  const value = new Date(expiryIso).getTime();
  if (!Number.isFinite(value)) return "Valid plan";
  const days = Math.max(0, Math.ceil((value - Date.now()) / (24 * 60 * 60 * 1000)));
  return days > 0 ? `Renews in ${days} day${days === 1 ? "" : "s"}` : "Renews today";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((state) => state.user);
  const hasActivePlan = usePlansStore((state) => state.hasActivePlan);
  const activePlan = usePlansStore((state) => state.activePlan);
  const activePlanExpiry = usePlansStore((state) => state.activePlanExpiry);
  const [navigatingPlans, setNavigatingPlans] = useState(false);

  const greeting = useMemo(() => getTimeGreeting(), []);
  const firstName = user?.full_name?.split(" ")[0] ?? "DemoUser";

  const { data: plans = [] } = useQuery({
    queryKey: ["alpharoam", "plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["alpharoam", "plans"],
      queryFn: fetchPlans,
      staleTime: 1000 * 60 * 10,
    });
  }, [queryClient]);

  const openPlans = useCallback((country?: { iso2: string; name: string }) => {
    setNavigatingPlans(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (country) {
      router.push({
        pathname: "/(app)/plans/country/[iso2]",
        params: { iso2: country.iso2, name: country.name },
      });
    } else {
      router.push("/(app)/plans");
    }

    setTimeout(() => setNavigatingPlans(false), 900);
  }, []);

  const onQuickActionPress = useCallback(
    (action: (typeof QUICK_ACTIONS)[number]["action"]) => {
      if (action === "plans") return openPlans();
      if (action === "profile") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return router.push("/(app)/profile");
      }
      if (action === "support") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return Alert.alert("Support", "Support chat is coming soon.");
      }
      return Alert.alert("Top Up", "Top up flow is coming soon.");
    },
    [openPlans]
  );

  return (
    <>
      <ScrollView
        style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />
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
                <Image
                  source={require("../../assets/icon2dark.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
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

            <Pressable
              style={({ pressed }) => [styles.heroCta, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => openPlans()}
              className="flex flex-row gap-2 bg-white rounded-full py-3 px-4 justify-center items-center flex-start"
            >
              <Text style={styles.heroCtaText}>Browse Our Plans</Text>
              <Ionicons name="arrow-forward" size={15} color="#0F172A" />
            </Pressable>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <View style={styles.quickActionRow}>
            {QUICK_ACTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => onQuickActionPress(item.action)}
                style={({ pressed }) => [
                  styles.qaCard,
                  isDark ? styles.qaCardDark : styles.qaCardLight,
                  pressed && (isDark ? styles.qaCardDarkPressed : styles.qaCardLightPressed),
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <View
                  style={[styles.qaIconWrap, { backgroundColor: item.bg, borderColor: item.borderColor }]}
                  className="p-4 border-2 rounded-full"
                >
                  <MaterialCommunityIcons name={item.icon as never} size={28} color="#fff" />
                </View>
                <Text style={[styles.qaLabel, isDark && styles.textLight]}>{item.label}</Text>
                <Text style={[styles.qaSub, isDark && styles.textMutedDark]}>{item.sub}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).delay(120)} style={styles.section}>
          <QuickCountrySearch
            plans={plans}
            isDark={isDark}
            onSelectCountry={(iso2, name) => openPlans({ iso2, name })}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).delay(160)} style={[styles.section, styles.mt6]}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionKicker, isDark && styles.textMutedDark]}>CURRENT PLAN</Text>
            {hasActivePlan ? (
              <Pressable onPress={() => router.push("/(app)/profile")}>
                <Text style={styles.sectionLink}>Manage</Text>
              </Pressable>
            ) : null}
          </View>

          {hasActivePlan && activePlan ? (
            <View style={[styles.currentPlanCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.planBadge}>
                <View style={styles.planBadgeDot} />
                <Text style={styles.planBadgeText}>Active plan</Text>
              </View>
              <Text style={[styles.planName, isDark && styles.textLight]}>{activePlan.name}</Text>
              <Text style={[styles.planDetail, isDark && styles.textMutedDark]}>
                {getExpiryLabel(activePlanExpiry)} · {formatPlanMeta(activePlan)}
              </Text>

              <View style={styles.planStatsRow}>
                <View style={[styles.planStat, isDark ? styles.planStatDark : styles.planStatLight]}>
                  <Text style={[styles.planStatVal, isDark && styles.textLight]}>
                    {activePlan.dataGb !== null ? `${activePlan.dataGb} GB` : "—"}
                  </Text>
                  <Text style={[styles.planStatLab, isDark && styles.textMutedDark]}>Data</Text>
                </View>
                <View style={[styles.planStat, isDark ? styles.planStatDark : styles.planStatLight]}>
                  <Text style={[styles.planStatVal, isDark && styles.textLight]}>
                    {activePlan.validityDays !== null ? `${activePlan.validityDays}d` : "—"}
                  </Text>
                  <Text style={[styles.planStatLab, isDark && styles.textMutedDark]}>Validity</Text>
                </View>
                <View style={[styles.planStat, isDark ? styles.planStatDark : styles.planStatLight]}>
                  <Text style={[styles.planStatVal, isDark && styles.textLight]}>
                    {activePlan.priceUsd !== null ? `$${activePlan.priceUsd}` : "—"}
                  </Text>
                  <Text style={[styles.planStatLab, isDark && styles.textMutedDark]}>Price</Text>
                </View>
              </View>
            </View>
          ) : (
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]
                  : ["#F8FAFC", "#F1F5F9"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noPlanCard}
            >
              <Ionicons
                name="cellular-outline"
                size={40}
                color={isDark ? "rgba(148,163,184,0.9)" : "rgba(100,116,139,0.75)"}
              />
              <Text style={[styles.noPlanTitle, isDark && styles.textLight]}>No Active Plan</Text>
              <Text style={[styles.noPlanSubtitle, isDark && styles.textMutedDark]}>
                Get connected in 190+ countries with one tap.
              </Text>
              <Pressable onPress={() => openPlans()} style={styles.noPlanCta}>
                <LinearGradient
                  colors={["#2563EB", "#1D4ED8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.noPlanCtaGradient}
                >
                  <Text style={styles.noPlanCtaText}>Browse Plans</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(190)} style={styles.section}>
          <PopularDestinations
            plans={plans}
            isDark={isDark}
            onSelectCountry={(iso2, name) => openPlans({ iso2, name })}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(220)} style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Why AlphaRoam?</Text>
          <View style={styles.trustList}>
            {TRUST_POINTS.map((item) => (
              <View key={item.title} style={[styles.trustCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={styles.trustIconWrap}>
                  <Ionicons name={item.icon as never} size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trustTitle, isDark && styles.textLight]}>{item.title}</Text>
                  <Text style={[styles.trustSubtitle, isDark && styles.textMutedDark]}>{item.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {navigatingPlans ? (
        <View style={styles.navLoadingPill}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.navLoadingText}>Opening plans...</Text>
        </View>
      ) : null}
    </>
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
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
    marginTop: 4,
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
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
  logo: {
    width: 110,
    height: 35,
  },
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
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.35,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 12,
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
  heroCtaText: { color: "#0F172A", fontSize: 12, fontWeight: "800" },

  section: { paddingHorizontal: 22, marginBottom: 22 },
  mt6: { marginTop: 6 },
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
  sectionLink: { fontSize: 11, fontWeight: "800", color: "#2563EB" },

  quickActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  qaCard: {
    flex: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },

  qaIconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  qaLabel: { fontSize: 11, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  qaSub: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginTop: 3,
  },
  qaCardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 9,
  },
  qaCardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 11,
  },
  qaCardLightPressed: {
    shadowOpacity: 0.09,
    elevation: 6,
  },
  qaCardDarkPressed: {
    shadowOpacity: 0.32,
    elevation: 8,
  },

  currentPlanCard: {
    borderRadius: 22,
    padding: 16,
  },
  planBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(22,163,74,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  planBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  planBadgeText: { fontSize: 10, fontWeight: "800", color: "#16A34A" },
  planName: { fontSize: 17, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  planDetail: { fontSize: 12, fontWeight: "500", color: "#64748B", marginTop: 4, marginBottom: 12 },
  planStatsRow: { flexDirection: "row", gap: 8 },
  planStat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  planStatLight: { backgroundColor: "#F1F5F9" },
  planStatDark: { backgroundColor: "rgba(255,255,255,0.06)" },
  planStatVal: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  planStatLab: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 2,
    textTransform: "uppercase",
  },
  noPlanCard: {
    borderRadius: 22,
    paddingVertical: 40,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  noPlanTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  noPlanSubtitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 20,
  },
  noPlanCta: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  noPlanCtaGradient: { paddingVertical: 12, paddingHorizontal: 26 },
  noPlanCtaText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  trustList: { marginTop: 12, gap: 10 },
  trustCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trustIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.15)",
  },
  trustTitle: { color: "#0F172A", fontSize: 13, fontWeight: "800" },
  trustSubtitle: { marginTop: 2, color: "#64748B", fontSize: 12, fontWeight: "500" },

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
  navLoadingPill: {
    position: "absolute",
    bottom: 104,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  navLoadingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
