import React, { useMemo, useState, useCallback } from "react";
import { View, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { FontAwesome, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "react-native";

import { Text } from "../../components/Text";
import { TextInput } from "../../components/TextInput";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { logout as logoutApi } from "../../services/auth";
import { usePlansStore } from "../../store/plansStore";
import * as Haptics from "expo-haptics";
import { AuthenticatedScreenWrapper } from "../../components/AuthenticatedScreenWrapper";
import { AppBottomSheet } from "../../components/sheets/AppBottomSheet";

function appVersionLabel(): string {
  const v =
    Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? "1.0.0";
  return `Version ${v}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, logout, setUser } = useAuthStore();
  const purchases = usePlansStore((s) => s.purchases);
  const themePref = useThemeStore((s) => s.theme);
  const setThemePref = useThemeStore((s) => s.setTheme);

  const [editOpen, setEditOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const openEdit = useCallback(() => {
    setDraftName(user?.full_name ?? "");
    setDraftEmail(user?.email ?? "");
    setDraftPhone(user?.phone ?? "");
    setEditOpen(true);
  }, [user?.full_name, user?.email, user?.phone]);

  const saveEdit = useCallback(() => {
    if (!user) {
      setEditOpen(false);
      return;
    }
    setUser({
      ...user,
      full_name: draftName.trim() || user.full_name,
      email: draftEmail.trim() || undefined,
      phone: draftPhone.trim() || undefined,
    });
    setEditOpen(false);
  }, [user, draftName, draftEmail, draftPhone, setUser]);

  const openSecurity = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityOpen(true);
  }, []);

  const closeSecurity = useCallback(() => {
    setSecurityOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdSubmitting(false);
  }, []);

  const submitPasswordChange = useCallback(() => {
    if (!currentPassword.trim()) {
      Alert.alert("Missing field", "Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Weak password", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    setPwdSubmitting(true);
    setTimeout(() => {
      setPwdSubmitting(false);
      closeSecurity();
      Alert.alert("Password updated", "This is a demo — no password was sent to a server.");
    }, 600);
  }, [currentPassword, newPassword, confirmPassword, closeSecurity]);

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

  const ph = isDark ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.5)";
  const inputSheet = [styles.sheetInput, isDark ? styles.sheetInputDark : styles.sheetInputLight];
  const lbl = (spaced?: boolean) => [styles.sheetLabel, isDark && styles.textMuted, spaced && styles.sheetLabelSpaced];

  return (
    <AuthenticatedScreenWrapper>
      <ScrollView
        style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" />

        <LinearGradient
          colors={isDark ? ["#0c1424", "#1a2744"] : ["#0F172A", "#1e3a5f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroOrbLg} pointerEvents="none" />
          <View style={styles.heroOrbSm} pointerEvents="none" />

          <View style={styles.heroAvatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>

            <Pressable
              onPress={openEdit}
              hitSlop={12}
              style={styles.heroEditBtn}
            >
              <FontAwesome6 name="edit" size={12.5} color="rgba(255,255,255,0.95)" />
              <Text style={styles.heroEditLabel}>Edit profile</Text>
            </Pressable>
          </View>

          <View style={{ paddingLeft: 12 }}>
            <Text style={styles.name}>{user?.full_name ?? "AlphaRoam Traveler"}</Text>
            <Text style={styles.emailLine} numberOfLines={1}>
              {user?.email ?? "Add details via Edit"}
            </Text>
            {user?.phone ? (
              <Text style={styles.phoneLine} numberOfLines={1}>
                {user.phone}
              </Text>
            ) : (
              <Text style={styles.phoneLineMuted}>No phone on file</Text>
            )}
          </View>

          {/* full widht logout button */}
          <Pressable onPress={handleLogout} className="w-full flex flex-row items-center gap-2 justify-center bg-red-500 rounded-full py-3">
            <FontAwesome name="sign-out" size={18} color="rgba(248,250,252,0.92)" />
            <Text style={{ color: "rgba(248,250,252,0.92)", fontSize: 13, fontWeight: "700" }}>Sign out</Text>
          </Pressable>
        </LinearGradient>

        <Text style={[styles.sectionEyebrow, isDark && styles.sectionEyebrowDark]}>Appearance</Text>
        <View style={[styles.menuCard, isDark ? styles.menuCardDark : styles.menuCardLight]}>
          <View style={styles.themeRow}>
            <View style={[styles.menuIconWrap, styles.themeIconBg]}>
              <Ionicons name="contrast-outline" size={20} color="#CA8A04" />
            </View>
            <View style={styles.menuRowBody}>
              <Text style={[styles.menuRowLabel, isDark && styles.textLight]}>App Theme</Text>
              <Text style={[styles.menuRowHint, isDark && styles.textMuted]}>Select preferrence</Text>
            </View>
            <View className="flex flex-row items-center gap-2 px-2" style={[styles.themeSegTrack, isDark && styles.themeSegTrackDark]}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  void setThemePref("light");
                }}
                className="flex flex-row items-center gap-2"
                style={({ pressed }) => [
                  styles.themeSegBtn,
                  themePref === "light" && styles.themeSegBtnActive,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <Ionicons
                  name="sunny"
                  size={15}
                  color={themePref === "light" ? "#2563EB" : isDark ? "#64748B" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.themeSegLabel,
                    themePref === "light" && styles.themeSegLabelActive,
                    themePref !== "light" && isDark && styles.themeSegMuted,
                  ]}
                >
                  Light
                </Text>
              </Pressable>
              <View style={{ height: 14, width: 1.5, backgroundColor: "#9ca3af" }} />
              <Pressable
                className="flex flex-row items-center gap-2 py-2 "
                onPress={() => {
                  void Haptics.selectionAsync();
                  void setThemePref("dark");
                }}
                style={({ pressed }) => [
                  styles.themeSegBtn,
                  themePref === "dark" && styles.themeSegBtnActive,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <Ionicons
                  name="moon"
                  size={15}
                  color={themePref === "dark" ? "#2563EB" : isDark ? "#64748B" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.themeSegLabel,
                    themePref === "dark" && styles.themeSegLabelActive,
                    themePref !== "dark" && isDark && styles.themeSegMuted,
                  ]}
                >
                  Dark
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionEyebrow, isDark && styles.sectionEyebrowDark]}>Support & security</Text>

<View className="flex flex-col gap-2">
        <View style={[styles.menuCard, isDark ? styles.menuCardDark : styles.menuCardLight]}>
          <MenuRow
            icon="shield-checkmark-outline"
            iconColor="#10B981"
            iconBg="rgba(16,185,129,0.14)"
            label="Security & password"
            hint="Change your sign-in password"
            isDark={isDark}
            onPress={openSecurity}
          />
        </View>


        <View style={[styles.menuCard, isDark ? styles.menuCardDark : styles.menuCardLight]}>
          <MenuRow
            icon="chatbubble-ellipses-outline"
            iconColor="#2563EB"
            iconBg="rgba(37,99,235,0.12)"
            label="Help & support"
            hint="We’re here when you need us"
            isDark={isDark}
            isFirst
            onPress={() =>
              Alert.alert(
                "Help & support",
                "Contact us at support@alpharoam.com or open an in-app chat when available (demo)."
              )
            }
          />
        </View>


        <View style={[styles.menuCard, isDark ? styles.menuCardDark : styles.menuCardLight]}>
          <MenuRow
            icon="document-text-outline"
            iconColor="#64748B"
            iconBg="rgba(100,116,139,0.14)"
            label="Privacy policy"
            hint="How we handle your data"
            isDark={isDark}
            onPress={() =>
              Alert.alert(
                "Privacy policy",
                "We protect your travel and account data. A full policy document will be linked here soon (demo)."
              )
            }
          />

        </View>
        </View>

        <View style={styles.spacer} />

        <Text style={[styles.versionText, isDark && styles.versionTextDark]}>{appVersionLabel()}</Text>
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      <AppBottomSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        heightRatio={0.58}
        title="Edit your profile"
        subtitle="Update your name and contact details"
        icon="person-outline"
        accentColors={["#2563EB", "#1D4ED8"]}
        footer={
          <Pressable onPress={saveEdit} style={({ pressed }) => [styles.sheetPrimaryBtn, pressed && { opacity: 0.92 }]}>
            <LinearGradient
              colors={["#2563EB", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetPrimaryBtnInner}
            >
              <MaterialCommunityIcons name="content-save-all" size={20} color="#ffffff" />
              <Text style={styles.sheetPrimaryBtnText}>Save changes</Text>
            </LinearGradient>
          </Pressable>
        }
      >
        <Text style={lbl()}>Full name</Text>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="Your name"
          placeholderTextColor={ph}
          style={inputSheet}
        />
        <Text style={lbl(true)}>Email</Text>
        <TextInput
          value={draftEmail}
          onChangeText={setDraftEmail}
          placeholder="you@example.com"
          placeholderTextColor={ph}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputSheet}
        />
        <Text style={lbl(true)}>Phone</Text>
        <TextInput
          value={draftPhone}
          onChangeText={setDraftPhone}
          placeholder="Optional"
          placeholderTextColor={ph}
          keyboardType="phone-pad"
          style={inputSheet}
        />
      </AppBottomSheet>

      {/* Password Bottom Sheet */}
      <AppBottomSheet
        visible={securityOpen}
        onClose={closeSecurity}
        heightRatio={0.62}
        title="App Security"
        subtitle="Secure your account with a strong password"
        icon="lock-closed-outline"
        accentColors={["#0D9488", "#059669"]}
        dismissible={!pwdSubmitting}
        footer={
          <Pressable
            onPress={submitPasswordChange}
            disabled={pwdSubmitting}
            style={({ pressed }) => [
              styles.sheetPrimaryBtn,
              pwdSubmitting && { opacity: 0.7 },
              pressed && !pwdSubmitting && { opacity: 0.92 },
            ]}
          >
            <LinearGradient
              colors={["#0D9488", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetPrimaryBtnInner}
            >
              <MaterialIcons name="update" size={20} color="#ffffff" />
              <Text style={styles.sheetPrimaryBtnText}>{pwdSubmitting ? "Updating…" : "Update password"}</Text>
            </LinearGradient>
          </Pressable>
        }
      >
        <Text style={lbl()}>Current password</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          placeholderTextColor={ph}
          secureTextEntry
          style={inputSheet}
          autoCapitalize="none"
        />
        <Text style={lbl(true)}>New password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          placeholderTextColor={ph}
          secureTextEntry
          style={inputSheet}
          autoCapitalize="none"
        />
        <Text style={lbl(true)}>Confirm new password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          placeholderTextColor={ph}
          secureTextEntry
          style={inputSheet}
          autoCapitalize="none"
        />
      </AppBottomSheet>
    </AuthenticatedScreenWrapper>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  iconBg,
  label,
  hint,
  isDark,
  onPress,
  isFirst,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBg: string;
  label: string;
  hint: string;
  isDark: boolean;
  onPress: () => void;
  isFirst?: boolean;
}) {
  return (
    <Pressable
      className="flex flex-row items-center justify-between gap-3 p-4"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !isFirst && styles.menuRowBorder,
        isDark && styles.menuRowBorderDark,
        pressed && { opacity: 0.88 },
      ]}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuRowBody}>
        <Text style={[styles.menuRowLabel, isDark && styles.textLight]}>{label}</Text>
        <Text style={[styles.menuRowHint, isDark && styles.textMuted]}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isDark ? "#64748B" : "#94A3B8"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F8FAFC" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMuted: { color: "rgba(148,163,184,0.75)" },

  hero: {
    marginHorizontal: 20,
    borderRadius: 34,
    padding: 20,
    paddingTop: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroOrbLg: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -70,
    right: -60,
    backgroundColor: "rgba(37,99,235,0.22)",
  },
  heroOrbSm: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    left: -24,
    bottom: 24,
    backgroundColor: "rgba(99,102,241,0.2)",
  },
  heroEditBtn: {

    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    zIndex: 2,
  },
  heroEditLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
  },

  heroAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.95)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
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
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  emailLine: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(226,232,240,0.92)",
    marginTop: 6,
  },
  phoneLine: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(148,163,184,0.9)",
    marginTop: 4,
  },
  phoneLineMuted: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(148,163,184,0.55)",
    marginTop: 4,
    marginBottom: 12,

    fontStyle: "italic",
  },
  heroStatsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  heroStat: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    alignItems: "center",
  },
  heroStatValue: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  heroStatLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(148,163,184,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  sectionEyebrow: {
    marginHorizontal: 22,
    marginTop: 22,
    marginBottom: 10,
    paddingLeft: 6,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    color: "#64748B",
    textTransform: "uppercase",
  },
  sectionEyebrowDark: { color: "rgba(148,163,184,0.65)" },

  menuCard: {
    padding: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  menuCardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.07)",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  menuCardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  menuRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15,23,42,0.08)",
  },
  menuRowBorderDark: {
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowBody: { flex: 1, minWidth: 0 },
  menuRowLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
  menuRowHint: { fontSize: 12, fontWeight: "500", color: "#64748B", marginTop: 2 },

  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  themeIconBg: {
    backgroundColor: "rgba(234,179,8,0.14)",
  },
  themeSegTrack: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  themeSegTrackDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  themeSegBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
    minWidth: 76,
  },
  themeSegBtnActive: {
    backgroundColor: "rgba(37,99,235,0.14)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.22)",
  },
  themeSegLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
  themeSegLabelActive: {
    color: "#2563EB",
  },
  themeSegMuted: {
    color: "rgba(148,163,184,0.75)",
  },

  spacer: { flex: 1, minHeight: 28 },

  versionText: {
    textAlign: "center",
    width: "100%",
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  versionTextDark: { color: "rgba(148,163,184,0.55)" },

  sheetLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
  },
  sheetLabelSpaced: { marginTop: 16 },
  sheetInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 12,
    fontWeight: "600",
  },
  sheetInputLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.1)",
    color: "#0F172A",
  },
  sheetInputDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#F8FAFC",
  },
  sheetPrimaryBtn: { borderRadius: 999, overflow: "hidden" },
  sheetPrimaryBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
  },
  sheetPrimaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
