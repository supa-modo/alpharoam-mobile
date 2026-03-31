import React, { useMemo, useState, useEffect } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "../Text";
import { AppBottomSheet } from "./AppBottomSheet";
import { usePlansStore } from "../../store/plansStore";
import { useAuthStore } from "../../store/authStore";

type PaymentMethod = "card" | "mpesa" | "apple_pay" | "google_pay";

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

const METHODS = [
  { id: "card" as const, label: "Credit or debit card", sub: "Visa, Mastercard, Amex", icon: "card-outline" as const },
  { id: "mpesa" as const, label: "M-Pesa", sub: "Pay from your phone", icon: "phone-portrait-outline" as const },
  { id: "apple_pay" as const, label: "Apple Pay", sub: "One-tap checkout", icon: "logo-apple" as const },
  { id: "google_pay" as const, label: "Google Pay", sub: "Fast & secure", icon: "logo-google" as const },
];

export function CheckoutFlowSheet({ visible, onClose }: Props) {
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
    const total = price;
    return { price, total };
  }, [selected]);

  useEffect(() => {
    if (!visible) {
      setSuccessId(null);
      setSubmitting(false);
    }
  }, [visible]);

  const handlePay = async () => {
    if (!selected) return;
    if (submitting) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const purchase = completePurchase(pricing.total);
      setSuccessId(purchase?.id ?? `purchase_${Date.now()}`);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitting(false);
    }
  };

  const formatMeta = () => {
    const p = selected?.plan;
    if (!p) return "";
    const parts: string[] = [];
    if (p.dataGb !== null) parts.push(`${p.dataGb} GB`);
    if (p.validityDays !== null) parts.push(`${p.validityDays} days`);
    return parts.join(" · ");
  };

  const dismissible = !submitting;
  const headerTitle = successId ? "You're all set" : "Checkout";
  const headerSubtitle = successId
    ? "Your eSIM is ready to activate."
    : "Secured checkout · Demo mode";

  const summaryFooter =
    !successId && selected ? (
      <View style={styles.footerStack}>
        <Pressable
          onPress={handlePay}
          disabled={submitting}
          style={({ pressed }) => [
            styles.payBtn,
            pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            submitting && { opacity: 0.75 },
          ]}
        >
          <LinearGradient
            colors={["#2563EB", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.payBtnText}>Pay {formatUsd(pricing.total)}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => {
            clearSelection();
            onClose();
          }}
          disabled={submitting}
          hitSlop={8}
        >
          <Text style={[styles.changePlan, isDark && { color: "#93C5FD" }]}>
            Change plan
          </Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.9}
      title={headerTitle}
      subtitle={headerSubtitle}
      icon={successId ? "checkmark-circle" : "shield-checkmark-outline"}
      accentColors={successId ? ["#16A34A", "#059669"] : ["#2563EB", "#1D4ED8"]}
      dismissible={dismissible}
      footer={summaryFooter}
    >
      {!successId && selected ? (
        <>
          <LinearGradient
            colors={isDark ? ["#102247", "#173A7A"] : ["#EFF6FF", "#DBEAFE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSummary, isDark ? styles.heroSummaryDark : styles.heroSummaryLight]}
          >
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryTitleCol}>
                <Text style={styles.summaryEyebrow}>
                  {selected.countryName} · {selected.plan.validityDays ?? 30} days
                </Text>
                <Text style={[styles.planTitle, isDark && styles.textLight]} numberOfLines={2}>
                  {selected.plan.name}
                </Text>
                <Text style={[styles.planMeta, isDark && styles.textMutedDark]}>{formatMeta()}</Text>
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.pricePillValue}>{formatUsd(pricing.total)}</Text>
                <Text style={styles.pricePillCurrency}>USD</Text>
              </View>
            </View>
            <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
            <View style={styles.summaryStatRow}>
              <SummaryStat
                label="Data"
                value={selected.plan.dataGb !== null ? `${selected.plan.dataGb} GB` : "Unlimited"}
                isDark={isDark}
              />
              <SummaryStat
                label="Days"
                value={selected.plan.validityDays !== null ? String(selected.plan.validityDays) : "30"}
                isDark={isDark}
              />
              <SummaryStat label="Speed" value="4G/5G" isDark={isDark} />
            </View>
          </LinearGradient>

          <Text style={[styles.blockLabel, isDark && styles.textMutedDark]}>ORDER SUMMARY</Text>
          <View style={[styles.rowCard, isDark ? styles.cardDark : styles.cardLight]}>
            <RowItem label="Destination" value={selected.countryName} isDark={isDark} />
            <RowItem label="Plan" value={selected.plan.name} isDark={isDark} />
            <RowItem label="Subtotal" value={formatUsd(pricing.price)} isDark={isDark} />
            <RowItem label="Tax" value="$0.00" isDark={isDark} last />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, isDark && styles.textLight]}>Total due</Text>
              <Text style={[styles.totalValue, isDark && styles.textLight]}>
                {formatUsd(pricing.total)}
              </Text>
            </View>
          </View>

          <Text style={[styles.blockLabel, isDark && styles.textMutedDark]}>PAY WITH</Text>
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setMethod(m.id);
                }}
                style={({ pressed }) => [
                  styles.methodCard,
                  isDark ? styles.methodCardDark : styles.methodCardLight,
                  active && styles.methodCardActive,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View
                  style={[
                    styles.methodIconWrap,
                    active && styles.methodIconWrapActive,
                  ]}
                >
                  <Ionicons
                    name={m.icon}
                    size={22}
                    color={active ? "#fff" : isDark ? "#94A3B8" : "#475569"}
                  />
                </View>
                <View style={styles.methodTextCol}>
                  <Text style={[styles.methodLabel, isDark && styles.textLight]}>{m.label}</Text>
                  <Text style={[styles.methodSub, isDark && styles.textMutedDark]}>{m.sub}</Text>
                </View>
                <Ionicons
                  name={active ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={active ? "#2563EB" : isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.45)"}
                />
              </Pressable>
            );
          })}

          <View style={styles.trustRow}>
            <Ionicons name="lock-closed-outline" size={14} color={isDark ? "#64748B" : "#94A3B8"} />
            <Text style={[styles.trustText, isDark && styles.textMutedDark]}>
              Encrypted demo · Receipt to {user?.email ?? "your account"}
            </Text>
          </View>
        </>
      ) : successId ? (
        <View style={styles.successBody}>
          <View style={[styles.successGlow, isDark && styles.successGlowDark]}>
            <LinearGradient
              colors={["rgba(34,197,94,0.25)", "rgba(34,197,94,0.05)"]}
              style={styles.successGradient}
            >
              <View style={styles.successIconRing}>
                <Ionicons name="checkmark" size={36} color="#16A34A" />
              </View>
            </LinearGradient>
          </View>
          <Text style={[styles.successHeadline, isDark && styles.textLight]}>
            Purchase confirmed
          </Text>
          <Text style={[styles.orderId, isDark && styles.textMutedDark]}>Order {successId}</Text>

          <Pressable
            onPress={() => {
              onClose();
              router.replace("/(app)");
            }}
            style={({ pressed }) => [styles.primaryFull, pressed && { opacity: 0.92 }]}
          >
            <LinearGradient
              colors={["#2563EB", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryFullInner}
            >
              <Text style={styles.primaryFullText}>Back to home</Text>
              <Ionicons name="home-outline" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              router.replace("/(app)/profile");
            }}
            style={({ pressed }) => [
              styles.secondaryFull,
              isDark ? styles.secondaryFullDark : styles.secondaryFullLight,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={[styles.secondaryFullText, isDark && styles.textLight]}>View profile</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              clearSelection();
              onClose();
            }}
          >
            <Text style={[styles.linkCenter, isDark && { color: "#93C5FD" }]}>
              Buy another plan
            </Text>
          </Pressable>
        </View>
      ) : null}
    </AppBottomSheet>
  );
}

function RowItem({
  label,
  value,
  isDark,
  last,
}: {
  label: string;
  value: string;
  isDark: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.rowItem, !last && styles.rowItemMargin]}>
      <Text style={[styles.rowItemLabel, isDark && styles.textMutedDark]}>{label}</Text>
      <Text style={[styles.rowItemValue, isDark && styles.textLight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SummaryStat({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View style={[styles.summaryStat, isDark ? styles.summaryStatDark : styles.summaryStatLight]}>
      <Text style={[styles.summaryStatValue, isDark && styles.textLight]}>{value}</Text>
      <Text style={[styles.summaryStatLabel, isDark && styles.textMutedDark]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  textLight: { color: "#F8FAFC" },
  textMutedDark: { color: "rgba(148,163,184,0.85)" },

  heroSummary: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroSummaryLight: {
    borderColor: "rgba(37,99,235,0.15)",
  },
  heroSummaryDark: {
    borderColor: "rgba(96,165,250,0.3)",
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryTitleCol: { flex: 1 },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pricePill: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 84,
    alignItems: "center",
  },
  pricePillValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  pricePillCurrency: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
    marginTop: 1,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(37,99,235,0.2)",
    marginVertical: 12,
  },
  summaryDividerDark: {
    backgroundColor: "rgba(147,197,253,0.3)",
  },
  summaryStatRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryStat: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  summaryStatLight: {
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  summaryStatDark: {
    backgroundColor: "rgba(15,23,42,0.28)",
  },
  summaryStatValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  summaryStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
    textTransform: "uppercase",
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  planTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  planMeta: { fontSize: 13, color: "#64748B", marginTop: 6, fontWeight: "600" },

  blockLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#64748B",
    marginBottom: 10,
    marginTop: 4,
  },
  rowCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },
  rowItem: {},
  rowItemMargin: { marginBottom: 12 },
  rowItemLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 4 },
  rowItemValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(100,116,139,0.2)",
    marginVertical: 12,
  },
  dividerDark: { backgroundColor: "rgba(255,255,255,0.1)" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },

  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  methodCardLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  methodCardDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  methodCardActive: {
    borderColor: "rgba(37,99,235,0.55)",
    borderWidth: 2,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconWrapActive: {
    backgroundColor: "#2563EB",
  },
  methodTextCol: { flex: 1 },
  methodLabel: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  methodSub: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "500" },

  trustRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 8 },
  trustText: { fontSize: 11, color: "#64748B", fontWeight: "600", flex: 1 },

  footerStack: { gap: 12 },
  payBtn: { borderRadius: 16, overflow: "hidden" },
  payGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  changePlan: { textAlign: "center", fontSize: 13, fontWeight: "700", color: "#2563EB" },

  successBody: { alignItems: "center", paddingBottom: 24 },
  successGlow: {
    marginBottom: 20,
    borderRadius: 999,
    overflow: "hidden",
  },
  successGlowDark: {},
  successGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(22,163,74,0.35)",
  },
  successHeadline: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  orderId: { fontSize: 12, fontWeight: "700", color: "#64748B", marginTop: 8, marginBottom: 24 },

  primaryFull: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  primaryFullInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  primaryFullText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  secondaryFull: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryFullLight: { backgroundColor: "rgba(15,23,42,0.06)" },
  secondaryFullDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  secondaryFullText: { fontWeight: "800", fontSize: 15, color: "#0F172A" },

  linkCenter: { fontSize: 13, fontWeight: "800", color: "#2563EB", paddingVertical: 8 },
});
