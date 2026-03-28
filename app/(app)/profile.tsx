import React from "react";
import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Text } from "../../components/Text";
import { useAuthStore } from "../../store/authStore";
import { logout as logoutApi } from "../../services/auth";
import { usePlansStore } from "../../store/plansStore";
import { router } from "expo-router";

const SETTINGS = [
  { icon: "planet-outline", label: "My eSIMs" },
  { icon: "pricetags-outline", label: "Browse plans" },
  { icon: "card-outline", label: "Payment Methods" },
  { icon: "shield-checkmark-outline", label: "Security" },
  { icon: "help-circle-outline", label: "Support" },
];

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

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
          <Ionicons name="person" size={26} color={isDark ? "#E2E8F0" : "#1E293B"} />
        </View>
        <View>
          <Text style={[styles.name, isDark && styles.textLight]}>
            {user?.full_name ?? "AlphaRoam Traveler"}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMutedDark]}>
            {user?.email ?? "traveler@alpharoam.com"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Account
        </Text>
        {SETTINGS.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => {
              if (item.label === "Browse plans") router.push("/(app)/plans");
            }}
            style={[styles.row, isDark ? styles.cardDark : styles.cardLight]}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color={isDark ? "#93C5FD" : "#2563EB"}
            />
            <Text style={[styles.rowLabel, isDark && styles.textLight]}>
              {item.label}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#94A3B8" : "#64748B"}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Preferences
        </Text>
        <View style={[styles.row, isDark ? styles.cardDark : styles.cardLight]}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={isDark ? "#93C5FD" : "#2563EB"}
          />
          <Text style={[styles.rowLabel, isDark && styles.textLight]}>
            Roaming alerts
          </Text>
          <Text style={[styles.rowValue, isDark && styles.textMutedDark]}>Enabled</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Recent purchases
        </Text>
        {purchases.length === 0 ? (
          <View style={[styles.row, isDark ? styles.cardDark : styles.cardLight]}>
            <Ionicons
              name="receipt-outline"
              size={20}
              color={isDark ? "#93C5FD" : "#2563EB"}
            />
            <Text style={[styles.rowLabel, isDark && styles.textLight]}>
              No purchases yet
            </Text>
          </View>
        ) : (
          purchases.slice(0, 3).map((p) => (
            <View key={p.id} style={[styles.row, isDark ? styles.cardDark : styles.cardLight]}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={isDark ? "#93C5FD" : "#2563EB"}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, isDark && styles.textLight]} numberOfLines={1}>
                  {p.planName}
                </Text>
                <Text style={[styles.subtitle, isDark && styles.textMutedDark]} numberOfLines={1}>
                  {p.countryName} • ${p.totalUsd.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLight: { backgroundColor: "rgba(37,99,235,0.12)" },
  avatarDark: { backgroundColor: "rgba(148,163,184,0.15)" },
  name: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B" },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  rowLabel: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  rowValue: { marginLeft: "auto", fontSize: 12, color: "#64748B" },

  cardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#EF4444",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
