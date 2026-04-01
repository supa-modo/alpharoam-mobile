import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert, Image, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { Text } from "../../components/Text";
import { useAuthStore } from "../../store/authStore";
import { usePlansStore } from "../../store/plansStore";
import { router } from "expo-router";
import { getTimeGreeting } from "../../lib/greeting";
import { fetchPlans } from "../../services/plans";
import { QuickCountrySearch } from "../../components/QuickCountrySearch";
import { PopularDestinations } from "../../components/PopularDestinations";
import { AuthenticatedScreenWrapper } from "../../components/AuthenticatedScreenWrapper";
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
    icon: "flash",
    label: "Instant",
    title: "Instant activation",
    subtitle: "Online in minutes after checkout — no store visit needed.",
    color: "#F59E0B",
    gradientColors: ["rgba(245,158,11,0.18)", "rgba(245,158,11,0.04)"],
  },
  {
    icon: "earth",
    label: "Global",
    title: "190+ countries",
    subtitle: "One app for regional and global travel. Always covered.",
    color: "#10B981",
    gradientColors: ["rgba(16,185,129,0.18)", "rgba(16,185,129,0.04)"],
  },
  {
    icon: "shield-check",
    label: "Honest",
    title: "No hidden fees",
    subtitle: "Simple pricing, transparent checkout. What you see is what you pay.",
    color: "#3B82F6",
    gradientColors: ["rgba(59,130,246,0.18)", "rgba(59,130,246,0.04)"],
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((state) => state.user);
  const hasActivePlan = usePlansStore((state) => state.hasActivePlan);
  const activePlan = usePlansStore((state) => state.activePlan);
  const activePlanExpiry = usePlansStore((state) => state.activePlanExpiry);

  const greeting = useMemo(() => getTimeGreeting(), []);
  const firstName = user?.full_name?.split(" ")[0] ?? "DemoUser";

  const { data: plans = [] } = useQuery({
    queryKey: ["alpharoam", "plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10,
  });

  const openPlans = useCallback((country?: { iso2: string; name: string }) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (country) {
      router.push({
        pathname: "/(app)/plans/country/[iso2]",
        params: { iso2: country.iso2, name: country.name },
      });
    } else {
      router.push("/(app)/plans");
    }
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
    <AuthenticatedScreenWrapper>
      <ScrollView
        style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
          {hasActivePlan && activePlan ? (
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
                  <Text style={styles.heroPillText}>{hasActivePlan ? "eSIM ready" : "No active plan"}</Text>
                </View>
              </View>

              <View style={styles.planBadge} className="bg-green-600 rounded-full -mt-2">
                <View className="w-2 h-2 rounded-[9999px] bg-green-100" />
                <Text className="text-green-100 text-xs font-bold">Active plan</Text>
              </View>
              <Text style={styles.heroHeadline}>
                {activePlan?.name || "Stay connected anywhere you land"}
              </Text>
              <Text style={styles.heroSub}>
                {activePlan?.name ? getExpiryLabel(activePlanExpiry) + " · " + formatPlanMeta(activePlan) : "Activate in minutes. Keep your number. Travel like a local."}
              </Text>

              <View style={styles.planStatsRow}>
                <View style={[styles.planStat, isDark ? styles.planStatDark : styles.planStatLight]}>
                  <Text style={[styles.planStatVal, isDark && styles.textLight]}>
                    {activePlan?.dataGb !== null ? `${activePlan?.dataGb} GB` : "—"}
                  </Text>
                  <Text style={[styles.planStatLab, isDark && styles.textMutedDark]}>Data</Text>
                </View>
                <View style={[styles.planStat, isDark ? styles.planStatDark : styles.planStatLight]}>
                  <Text style={[styles.planStatVal, isDark && styles.textLight]}>
                    {activePlan?.validityDays !== null ? `${activePlan?.validityDays}d` : "—"}
                  </Text>
                  <Text style={[styles.planStatLab, isDark && styles.textMutedDark]}>Validity</Text>
                </View>
                <View style={[styles.planStat, isDark ? styles.planStatDark : styles.planStatLight]}>
                  <Text style={[styles.planStatVal, isDark && styles.textLight]}>
                    {activePlan?.priceUsd !== null ? `$${activePlan?.priceUsd}` : "—"}
                  </Text>
                  <Text style={[styles.planStatLab, isDark && styles.textMutedDark]}>Price</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
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
                  <Text style={styles.heroPillText}>{hasActivePlan ? "eSIM ready" : "No active plan"}</Text>
                </View>
              </View>

              <Text style={styles.heroEyebrow} >Global data (190+ countries)</Text>
              <Text style={styles.heroHeadline}>
                Stay connected anywhere you land
              </Text>
              <Text style={styles.heroSub}>
                Get connected in 190+ countries with one tap in minutes. Travel like a local.
              </Text>

              <Pressable
                style={({ pressed }) => [styles.heroCta, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={() => openPlans()}
                className="flex flex-row gap-2 bg-white rounded-full py-3.5 px-4 justify-center items-center flex-start"
              >
                <Text style={styles.heroCtaText}>Browse Our Plans</Text>
                <Ionicons name="arrow-forward" size={15} color="#0F172A" />
              </Pressable>
            </LinearGradient>
          )}

        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.qaShadowWrap,
                  isDark ? styles.qaNativeShadowDark : styles.qaNativeShadowLight,
                ]}
              >
                <Pressable
                  onPress={() => onQuickActionPress(item.action)}
                  className={[
                    "flex-1 items-center justify-center rounded-3xl px-2 py-4",
                    isDark
                      ? "border border-white/10 bg-slate-900/85"
                      : "border border-slate-200/70 bg-white",
                  ].join(" ")}
                  style={({ pressed }) => [
                    pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
                  ]}
                >
                  <View
                    style={{ backgroundColor: item.bg, borderColor: item.borderColor }}
                    className="mb-2.5 h-14 w-14 items-center justify-center rounded-full border-2"
                  >
                    <MaterialCommunityIcons name={item.icon as never} size={23} color="#fff" />
                  </View>
                  <Text style={styles.quickActionLabel} className={isDark ? "text-center text-[11px] font-bold text-primary-500" : "text-center text-[11px] font-bold text-slate-900"}>
                    {item.label}
                  </Text>
                  <Text className={isDark ? "mt-1 text-center text-[9px] font-semibold text-slate-400" : "mt-1 text-center text-[9px] font-semibold text-slate-500"}>
                    {item.sub}
                  </Text>
                </Pressable>
              </View>
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


        <Animated.View
          entering={FadeInDown.duration(450).delay(190)}
          style={[styles.section, styles.fullBleedDestinationsSection]}
        >
          <PopularDestinations
            plans={plans}
            isDark={isDark}
            onSelectCountry={(iso2, name) => openPlans({ iso2, name })}
          />
        </Animated.View>


        <Animated.View entering={FadeInDown.duration(450).delay(220)} style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Why Choose AlphaRoam?</Text>
            <View style={[styles.whyBadge, isDark ? styles.whyBadgeDark : styles.whyBadgeLight]}>
              <Text style={styles.whyBadgeText}>Trusted worldwide</Text>
            </View>
          </View>

          <View style={[styles.trustCard, isDark ? styles.trustCardDark : styles.trustCardLight]}>
            {TRUST_POINTS.map((item, index) => {
              const isLast = index === TRUST_POINTS.length - 1;
              return (
                <View key={item.title}>
                  <View style={styles.trustRow}>
                    {/* Icon bubble */}
                    <View style={[styles.trustIconOuter, { backgroundColor: item.gradientColors[0] }]}>
                      <View style={[styles.trustIconInner, { backgroundColor: item.color + "22" }]}>
                        <MaterialCommunityIcons name={item.icon as never} size={24} color={item.color} />
                      </View>
                    </View>

                    {/* Text */}
                    <View style={{ flex: 1 }}>
                      <View style={styles.trustTitleRow}>
                        <Text style={[styles.trustTitle, isDark && styles.textLight]}>
                          {item.title}
                        </Text>
                        <View style={[styles.trustLabelPill, { backgroundColor: item.color + "18" }]}>
                          <Text style={[styles.trustLabelText, { color: item.color }]}>
                            {item.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.trustSubtitle, isDark && styles.textMutedDark]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Divider between rows */}
                  {!isLast && (
                    <View
                      style={[
                        styles.trustDivider,
                        isDark ? styles.trustDividerDark : styles.trustDividerLight,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </Animated.View>
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
    marginBottom: 3,
  },
  heroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 19,
    marginBottom: 12,
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
  heroCtaText: { color: "#0F172A", fontSize: 12.5, fontWeight: "800" },

  section: { paddingHorizontal: 22, marginBottom: 22 },
  fullBleedDestinationsSection: { paddingHorizontal: 0 },
  mt6: { marginTop: 6 },
  sectionKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#64748B",
    marginBottom: 10,
  },
  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  sectionLink: { fontSize: 11, fontWeight: "800", color: "#2563EB" },

  quickActionsRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "nowrap",
  },
  qaShadowWrap: {
    width: "23.5%",
    minWidth: 76,
    borderRadius: 24,
  },
  qaNativeShadowLight: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 15,
    elevation: 8,
  },
  qaNativeShadowDark: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  planBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  quickActionLabel: {
    fontWeight: "800",
  },

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

  trustIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.15)",
  },

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
  whyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  whyBadgeLight: {
    backgroundColor: "rgba(37,99,235,0.1)",
  },
  whyBadgeDark: {
    backgroundColor: "rgba(59,130,246,0.15)",
  },
  whyBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.3,
  },
  trustCard: {
    marginTop: 12,
    borderRadius: 22,
    overflow: "hidden",
  },
  trustCardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.05)",
  },
  trustCardDark: {
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  trustIconOuter: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  trustIconInner: {
    width: 45,
    height: 45,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.1,
  },
  trustLabelPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  trustLabelText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  trustSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 18,
  },
  trustDivider: {
    marginHorizontal: 16,
    height: StyleSheet.hairlineWidth,
  },
  trustDividerLight: {
    backgroundColor: "rgba(15,23,42,0.07)",
  },
  trustDividerDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
