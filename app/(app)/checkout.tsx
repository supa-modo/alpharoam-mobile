import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../../components/Text";
import { usePlansStore } from "../../store/plansStore";
import { useAuthStore } from "../../store/authStore";

type PaymentMethod = "card" | "mpesa" | "apple_pay" | "google_pay";

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const user = useAuthStore((s) => s.user);
  const selected = usePlansStore((s) => s.selected);
  const clearSelection = usePlansStore((s) => s.clearSelection);
  const completePurchase = usePlansStore((s) => s.completePurchase);

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const pricing = useMemo(() => {
    const price = selected?.plan.priceUsd ?? 0;
    const serviceFee = 0;
    const tax = 0;
    const total = price + serviceFee + tax;
    return { price, serviceFee, tax, total };
  }, [selected]);

  React.useEffect(() => {
    if (!selected && !successId) {
      router.replace("/(app)/plans");
    }
  }, [selected, successId]);

  const handleBack = () => {
    if (submitting) return;
    if (successId) {
      router.replace("/(app)");
      return;
    }
    router.back();
  };

  const handlePay = async () => {
    if (!selected) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const purchase = completePurchase(pricing.total);
      setSuccessId(purchase?.id ?? `purchase_${Date.now()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = successId ? "Payment successful" : "Checkout";

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
      contentContainerStyle={{
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          style={[styles.iconBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
        >
          <Ionicons
            name={successId ? "close" : "arrow-back"}
            size={18}
            color={isDark ? "#E2E8F0" : "#0F172A"}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1}>
            {headerTitle}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMutedDark]} numberOfLines={1}>
            {successId
              ? "Your eSIM plan is ready to activate."
              : "Simulated payment flow (no backend)."}
          </Text>
        </View>
      </View>

      {successId ? (
        <View style={styles.content}>
          <View style={[styles.successCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark" size={18} color="#16A34A" />
            </View>
            <Text style={[styles.successTitle, isDark && styles.textLight]}>
              Purchase confirmed
            </Text>
            <Text style={[styles.successMeta, isDark && styles.textMutedDark]}>
              Order ID: {successId}
            </Text>
          </View>

          <Pressable
            onPress={() => router.replace("/(app)")}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.primaryBtnText}>Go to dashboard</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(app)/profile")}
            style={({ pressed }) => [
              styles.secondaryBtn,
              isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={[styles.secondaryBtnText, isDark && styles.textLight]}>
              View profile
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setSuccessId(null);
              clearSelection();
              router.replace("/(app)/plans");
            }}
            style={({ pressed }) => [
              styles.linkBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.linkText, isDark && { color: "#93C5FD" }]}>
              Buy another plan
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Order summary
            </Text>

            <View style={styles.row}>
              <Text style={[styles.rowLabel, isDark && styles.textMutedDark]}>Plan</Text>
              <Text style={[styles.rowValue, isDark && styles.textLight]} numberOfLines={1}>
                {selected?.plan.name ?? "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, isDark && styles.textMutedDark]}>Country</Text>
              <Text style={[styles.rowValue, isDark && styles.textLight]} numberOfLines={1}>
                {selected?.countryName ?? "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, isDark && styles.textMutedDark]}>Amount</Text>
              <Text style={[styles.rowValue, isDark && styles.textLight]}>
                {formatUsd(pricing.price)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={[styles.totalLabel, isDark && styles.textLight]}>Total</Text>
              <Text style={[styles.totalValue, isDark && styles.textLight]}>
                {formatUsd(pricing.total)}
              </Text>
            </View>
          </View>

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Payment method
            </Text>

            {([
              { id: "card", label: "Card", icon: "card-outline" },
              { id: "mpesa", label: "M-Pesa", icon: "phone-portrait-outline" },
              { id: "apple_pay", label: "Apple Pay", icon: "logo-apple" },
              { id: "google_pay", label: "Google Pay", icon: "logo-google" },
            ] as const).map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                style={[
                  styles.methodRow,
                  isDark ? styles.methodRowDark : styles.methodRowLight,
                  method === m.id && styles.methodRowActive,
                ]}
              >
                <Ionicons
                  name={m.icon as any}
                  size={18}
                  color={method === m.id ? "#2563EB" : isDark ? "#94A3B8" : "#64748B"}
                />
                <Text style={[styles.methodLabel, isDark && styles.textLight]}>
                  {m.label}
                </Text>
                <Ionicons
                  name={method === m.id ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={method === m.id ? "#2563EB" : isDark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.6)"}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            ))}

            <Text style={[styles.note, isDark && styles.textMutedDark]}>
              Receipt will be linked to: {user?.email ?? "your account"}
            </Text>
          </View>

          <Pressable
            onPress={handlePay}
            disabled={submitting || !selected}
            style={({ pressed }) => [
              styles.primaryBtn,
              (submitting || !selected) && { opacity: 0.7 },
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Pay {formatUsd(pricing.total)}</Text>
                <Ionicons name="lock-closed-outline" size={16} color="#fff" />
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              clearSelection();
              router.replace("/(app)/plans");
            }}
            disabled={submitting}
            style={({ pressed }) => [
              styles.linkBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.linkText, isDark && { color: "#93C5FD" }]}>
              Cancel and change plan
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: "#F8FAFC" },
  bgDark: { backgroundColor: "#020617" },
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.7)" },

  topBar: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnLight: { backgroundColor: "rgba(15,23,42,0.06)" },
  iconBtnDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  title: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },

  content: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 18, padding: 14 },
  successCard: { borderRadius: 18, padding: 16, alignItems: "center", gap: 8 },
  successIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(22,163,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  successMeta: { fontSize: 12, color: "#64748B", fontWeight: "700" },

  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  rowLabel: { width: 70, fontSize: 12, fontWeight: "700", color: "#64748B" },
  rowValue: { flex: 1, fontSize: 12, fontWeight: "800", color: "#0F172A", textAlign: "right" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(100,116,139,0.25)", marginVertical: 10 },
  totalLabel: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  totalValue: { fontSize: 14, fontWeight: "900", color: "#0F172A" },

  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  methodRowLight: { backgroundColor: "rgba(15,23,42,0.03)" },
  methodRowDark: { backgroundColor: "rgba(148,163,184,0.10)" },
  methodRowActive: { borderWidth: 1, borderColor: "rgba(37,99,235,0.55)" },
  methodLabel: { fontSize: 13, fontWeight: "800", color: "#0F172A" },

  note: { marginTop: 2, fontSize: 11, color: "#64748B", fontWeight: "600" },

  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  secondaryBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnLight: { backgroundColor: "rgba(15,23,42,0.06)" },
  secondaryBtnDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  secondaryBtnText: { fontWeight: "900", fontSize: 14, color: "#0F172A" },

  linkBtn: { alignItems: "center", paddingVertical: 10 },
  linkText: { fontSize: 12, fontWeight: "800", color: "#2563EB" },

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

