import React from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Text } from "../../components/Text";
import { useAuthStore } from "../../store/authStore";
import { router } from "expo-router";

const QUICK_ACTIONS = [
  { icon: "wifi-outline", label: "Buy Data" },
  { icon: "flash-outline", label: "Top Up" },
  { icon: "qr-code-outline", label: "Scan eSIM" },
];

const STAT_CARDS = [
  { title: "Active eSIM", value: "1", subtitle: "US + Europe" },
  { title: "Data Remaining", value: "3.2 GB", subtitle: "Renews in 7 days" },
  { title: "Coverage", value: "190+ Countries", subtitle: "Global partners" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((state) => state.user);

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, isDark && styles.textMutedDark]}>
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
          </Text>
          <Text style={[styles.title, isDark && styles.textLight]}>
            AlphaRoam Dashboard
          </Text>
        </View>
        <View style={[styles.headerBadge, isDark && styles.headerBadgeDark]}>
          <Ionicons name="airplane-outline" size={14} color="#2563EB" />
          <Text style={[styles.headerBadgeText, isDark && { color: "#93C5FD" }]}>
            Ready to roam
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={isDark ? ["#0F172A", "#1E293B"] : ["#2563EB", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroTitle}>Your next trip is covered</Text>
        <Text style={styles.heroSubtitle}>
          Activate an eSIM in minutes and keep your main number active.
        </Text>
        <Pressable style={styles.heroCta} onPress={() => router.push("/(app)/plans")}>
          <Text style={styles.heroCtaText}>Browse Plans</Text>
          <Ionicons name="arrow-forward" size={16} color="#0F172A" />
        </Pressable>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Quick actions
        </Text>
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                if (action.label === "Buy Data") router.push("/(app)/plans");
              }}
              style={[styles.quickCard, isDark ? styles.cardDark : styles.cardLight]}
            >
              <Ionicons
                name={action.icon as any}
                size={20}
                color={isDark ? "#93C5FD" : "#2563EB"}
              />
              <Text style={[styles.quickLabel, isDark && styles.textLight]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Current plan
        </Text>
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((card) => (
            <View
              key={card.title}
              style={[styles.statCard, isDark ? styles.cardDark : styles.cardLight]}
            >
              <Text style={[styles.statTitle, isDark && styles.textMutedDark]}>
                {card.title}
              </Text>
              <Text style={[styles.statValue, isDark && styles.textLight]}>
                {card.value}
              </Text>
              <Text style={[styles.statSubtitle, isDark && styles.textMutedDark]}>
                {card.subtitle}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F8FAFC" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.7)" },

  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  greeting: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  headerBadgeDark: {
    backgroundColor: "rgba(37,99,235,0.18)",
  },
  headerBadgeText: { fontSize: 11, fontWeight: "700", color: "#1D4ED8" },

  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 16 },
  heroCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroCtaText: { color: "#0F172A", fontSize: 12, fontWeight: "700" },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12 },

  quickRow: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 18,
  },
  quickLabel: { fontSize: 12, fontWeight: "600", color: "#0F172A" },

  statsGrid: { gap: 12 },
  statCard: { borderRadius: 18, padding: 16, gap: 4 },
  statTitle: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  statSubtitle: { fontSize: 12, color: "#94A3B8" },

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
