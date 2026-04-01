import React, { useMemo } from "react";
import { View, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Text } from "../../components/Text";
import { useAuthStore } from "../../store/authStore";
import { logout as logoutApi } from "../../services/auth";
import { usePlansStore } from "../../store/plansStore";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "react-native";
import { AuthenticatedScreenWrapper } from "../../components/AuthenticatedScreenWrapper";

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBg: string;
  label: string;
  hint: string;
  badge?: string;
  action: () => void;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, logout } = useAuthStore();
  const purchases = usePlansStore((s) => s.purchases);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      await logout();
    }
  };

  const initials = useMemo(() => {
    const fullName = user?.full_name?.trim();
    if (!fullName) return "AR";
    const parts = fullName.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "AR";
  }, [user?.full_name]);

  const purchasesCount = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + p.totalUsd, 0);
  const countriesVisited = new Set(purchases.map((p) => p.countryName)).size;

  const showComingSoon = (label: string) =>
    Alert.alert(label, "This section is coming soon. Use Browse plans meanwhile.");

  const accountItems: MenuItem[] = [
    {
      icon: "person-outline",
      iconColor: "#2563EB",
      iconBg: "rgba(37,99,235,0.12)",
      label: "Personal Info",
      hint: "Name, email, phone",
      action: () => showComingSoon("Personal Info"),
    },
    {
      icon: "shield-checkmark-outline",
      iconColor: "#10B981",
      iconBg: "rgba(16,185,129,0.14)",
      label: "Security",
      hint: "Password, 2FA",
      action: () => showComingSoon("Security"),
    },
    {
      icon: "notifications-outline",
      iconColor: "#8B5CF6",
      iconBg: "rgba(139,92,246,0.13)",
      label: "Notifications",
      hint: "Alerts and reminders",
      badge: "3 new",
      action: () => showComingSoon("Notifications"),
    },
  ];

  const esimItems: MenuItem[] = [
    {
      icon: "radio-outline",
      iconColor: "#2563EB",
      iconBg: "rgba(37,99,235,0.12)",
      label: "Active eSIMs",
      hint: "Manage your active SIMs",
      badge: String(Math.max(1, purchasesCount)),
      action: () => router.push("/(app)"),
    },
    {
      icon: "receipt-outline",
      iconColor: "#F59E0B",
      iconBg: "rgba(245,158,11,0.14)",
      label: "Purchase History",
      hint: "View past orders",
      action: () => showComingSoon("Purchase History"),
    },
    {
      icon: "card-outline",
      iconColor: "#10B981",
      iconBg: "rgba(16,185,129,0.14)",
      label: "Payment Methods",
      hint: "Cards and M-Pesa",
      action: () => showComingSoon("Payment Methods"),
    },
    {
      icon: "planet-outline",
      iconColor: "#2563EB",
      iconBg: "rgba(37,99,235,0.12)",
      label: "Browse plans",
      hint: "Find data packs worldwide",
      action: () => router.push("/(app)/plans"),
    },
  ];

  const supportItems: MenuItem[] = [
    {
      icon: "chatbubble-ellipses-outline",
      iconColor: "#2563EB",
      iconBg: "rgba(37,99,235,0.12)",
      label: "Help and Support",
      hint: "Chat with us",
      action: () => showComingSoon("Help and Support"),
    },
    {
      icon: "document-text-outline",
      iconColor: "#64748B",
      iconBg: "rgba(100,116,139,0.14)",
      label: "Privacy Policy",
      hint: "How we use your data",
      action: () => showComingSoon("Privacy Policy"),
    },
    {
      icon: "information-circle-outline",
      iconColor: "#64748B",
      iconBg: "rgba(100,116,139,0.14)",
      label: "App Version",
      hint: "v2.4.1 (Build 140)",
      action: () => Alert.alert("App Version", "AlphaRoam v2.4.1 (Build 140)"),
    },
  ];

  return (
    <AuthenticatedScreenWrapper>
      <ScrollView
        style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"

        />
        <LinearGradient
          colors={isDark ? ["#0B1220", "#1E293B"] : ["#0F172A", "#1E293B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
        <View style={styles.heroOrbLg} />
        <View style={styles.heroOrbSm} />
        <View style={styles.heroAvatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.name}>{user?.full_name ?? "AlphaRoam Traveler"}</Text>
        <Text style={styles.subtitle}>{user?.email ?? "traveler@alpharoam.com"} · Pro Member</Text>

        <View style={styles.heroStatsRow}>
          <Stat label="Active eSIMs" value={String(Math.max(1, purchasesCount))} />
          <Stat label="Total Spent" value={`$${totalSpent.toFixed(0)}`} />
          <Stat label="Countries" value={String(Math.max(1, countriesVisited))} />
        </View>
      </LinearGradient>

      <SectionLabel title="ACCOUNT" isDark={isDark} />
      <MenuCard items={accountItems} isDark={isDark} />

      <SectionLabel title="MY ESIMS AND PLANS" isDark={isDark} />
      <MenuCard items={esimItems} isDark={isDark} />

      <SectionLabel title="SUPPORT AND ABOUT" isDark={isDark} />
      <MenuCard items={supportItems} isDark={isDark} />

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </AuthenticatedScreenWrapper>
  );
}

function SectionLabel({ title, isDark }: { title: string; isDark: boolean }) {
  return <Text style={[styles.sectionLabel, isDark && styles.textMutedDark]}>{title}</Text>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function MenuCard({ items, isDark }: { items: MenuItem[]; isDark: boolean }) {
  return (
    <View style={[styles.menuCard, isDark ? styles.cardDark : styles.cardLight]}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={item.action}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
            <Ionicons name={item.icon} size={18} color={item.iconColor} />
          </View>
          <View style={styles.menuBody}>
            <Text style={[styles.rowLabel, isDark && styles.textLight]}>{item.label}</Text>
            <Text style={[styles.rowHint, isDark && styles.textMutedDark]}>{item.hint}</Text>
          </View>
          {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDark ? "#94A3B8" : "#94A3B8"}
            style={styles.rowChevron}
          />
          {index < items.length - 1 ? (
            <View style={[styles.rowDivider, isDark && styles.rowDividerDark]} />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F8FAFC" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.7)" },

  hero: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  heroOrbLg: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -56,
    right: -50,
    backgroundColor: "rgba(37,99,235,0.2)",
  },
  heroOrbSm: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    left: 12,
    bottom: -20,
    backgroundColor: "rgba(99,102,241,0.22)",
  },
  heroAvatarRow: {
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.9)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.6 },
  verifiedBadge: {
    position: "absolute",
    left: 52,
    top: 52,
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: "#16A34A",
    borderColor: "#1E293B",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.4 },
  subtitle: {
    fontSize: 12,
    color: "rgba(148,163,184,0.85)",
    marginTop: 4,
    marginBottom: 14,
    fontWeight: "500",
  },
  heroStatsRow: { flexDirection: "row", gap: 10 },
  heroStat: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    alignItems: "center",
  },
  heroStatValue: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  heroStatLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(148,163,184,0.8)",
    textTransform: "uppercase",
  },

  sectionLabel: {
    paddingHorizontal: 22,
    marginBottom: 10,
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#94A3B8",
  },
  menuCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    position: "relative",
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuBody: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  rowHint: { fontSize: 11, color: "#64748B", fontWeight: "500", marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.12)",
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 8,
  },
  rowChevron: { marginLeft: 8 },
  rowDivider: {
    position: "absolute",
    left: 62,
    right: 14,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15,23,42,0.08)",
  },
  rowDividerDark: { backgroundColor: "rgba(255,255,255,0.1)" },

  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.07)",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: { color: "#EF4444", fontWeight: "800", fontSize: 14 },
});
