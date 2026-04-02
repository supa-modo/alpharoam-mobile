import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "../Text";
import { TextInput } from "../TextInput";
import { AppBottomSheet } from "./AppBottomSheet";
import { usePlansStore } from "../../store/plansStore";
import { useAuthStore } from "../../store/authStore";
import MpesaIcon from "../MpesaIcon";

type PaymentMethod = "mpesa" | "card" | "wallet";
type WalletProvider = "google" | "apple";

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function isValidMpesaPhone(raw: string): boolean {
  const d = digitsOnly(raw);
  if (d.length === 12 && d.startsWith("254") && d[3] === "7") return true;
  if (d.length === 10 && d.startsWith("07")) return true;
  if (d.length === 9 && d.startsWith("7")) return true;
  return false;
}

function luhnCheck(num: string): boolean {
  const d = digitsOnly(num);
  if (d.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function isExpiryValid(raw: string): boolean {
  const d = digitsOnly(raw);
  if (d.length !== 4) return false;
  const m = parseInt(d.slice(0, 2), 10);
  const y = parseInt(d.slice(2, 4), 10);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const cy = now.getFullYear() % 100;
  const cm = now.getMonth() + 1;
  if (y < cy || (y === cy && m < cm)) return false;
  return true;
}

function formatCardGroups(digits: string): string {
  const d = digitsOnly(digits).slice(0, 19);
  const parts: string[] = [];
  for (let i = 0; i < d.length; i += 4) {
    parts.push(d.slice(i, i + 4));
  }
  return parts.join(" ");
}

function formatExpiryInput(raw: string): string {
  const d = digitsOnly(raw).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CheckoutFlowSheet({ visible, onClose }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const user = useAuthStore((s) => s.user);
  const selected = usePlansStore((s) => s.selected);
  const clearSelection = usePlansStore((s) => s.clearSelection);
  const completePurchase = usePlansStore((s) => s.completePurchase);

  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [walletProvider, setWalletProvider] = useState<WalletProvider>("google");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const pricing = useMemo(() => {
    const price = selected?.plan.priceUsd ?? 0;
    return { price, total: price };
  }, [selected]);

  useEffect(() => {
    if (!visible) {
      setSuccessId(null);
      setSubmitting(false);
      setMpesaPhone("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardName("");
      setMethod("mpesa");
      setWalletProvider("google");
    }
  }, [visible]);

  const formatMetaLine = useCallback(() => {
    const p = selected?.plan;
    if (!p) return "";
    return `${selected?.countryName ?? ""} · ${p.region ?? "Global"}`;
  }, [selected]);

  const payReady = useMemo(() => {
    if (method === "mpesa") return isValidMpesaPhone(mpesaPhone);
    if (method === "wallet") return true;
    const num = digitsOnly(cardNumber);
    const cvv = digitsOnly(cardCvv);
    return (
      num.length >= 13 &&
      num.length <= 19 &&
      luhnCheck(num) &&
      isExpiryValid(cardExpiry) &&
      (cvv.length === 3 || cvv.length === 4)
    );
  }, [method, mpesaPhone, cardNumber, cardExpiry, cardCvv]);

  const handlePay = async () => {
    if (!selected || !payReady) return;
    if (submitting) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1100));
      const purchase = completePurchase(pricing.total);
      setSuccessId(purchase?.id ?? `purchase_${Date.now()}`);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitting(false);
    }
  };

  const dismissible = !submitting;
  const headerTitle = successId ? "You're all set" : "Checkout";
  const headerSubtitle = successId ? "Your eSIM is ready to activate." : "Demo payment — no charge";

  const placeholder = isDark ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.5)";

  const summaryFooter =
    !successId && selected ? (
      <View style={styles.footerStack}>
        <Pressable
          onPress={handlePay}
          disabled={submitting || !payReady}
          style={({ pressed }) => [
            styles.payBtn,
            (!payReady || submitting) && styles.payBtnDisabled,
            pressed && payReady && !submitting && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          ]}
        >
          <LinearGradient
            colors={payReady && !submitting ? ["#2563EB", "#1D4ED8"] : ["#94A3B8", "#64748B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={14} color="#fff" />
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
          <Text style={[styles.changePlan, isDark && { color: "#93C5FD" }]}>Change plan</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      fitContent
      minHeightRatio={0.6}
      maxHeightRatio={0.95}
      title={headerTitle}
      subtitle={headerSubtitle}
      icon={successId ? "checkmark-circle" : "card-outline"}
      accentColors={successId ? ["#16A34A", "#059669"] : ["#2563EB", "#1D4ED8"]}
      dismissible={dismissible}
      footer={summaryFooter}
    >
      {!successId && selected ? (
        <>
          <LinearGradient
            colors={isDark ? ["#1e3a8a", "#1d4ed8"] : ["#2563EB", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroOrbLg} pointerEvents="none" />
            <View style={styles.heroOrbSm} pointerEvents="none" />

            <Text style={styles.heroEyebrow}>YOUR PLAN</Text>
            <Text style={styles.heroName} numberOfLines={2}>
              {selected.plan.name}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {formatMetaLine()}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statVal}>{selected.plan.dataGb ?? 0} GB</Text>
                <Text style={styles.statLbl}>Data</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statVal}>{selected.plan.validityDays ?? 30}</Text>
                <Text style={styles.statLbl}>Days</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statVal}>4G/5G</Text>
                <Text style={styles.statLbl}>Speed</Text>
              </View>
            </View>

            <Text style={styles.heroPrice}>{formatUsd(pricing.total)}</Text>
          </LinearGradient>

          <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>ORDER SUMMARY</Text>
          <View style={[styles.summaryCard, isDark ? styles.summaryCardDark : styles.summaryCardLight]}>
            <SummaryRow label="Plan" value={selected.plan.name} isDark={isDark} />
            <SummaryRow
              label="Data"
              value={selected.plan.dataGb !== null ? `${selected.plan.dataGb} GB` : "Unlimited"}
              isDark={isDark}
            />
            <SummaryRow
              label="Validity"
              value={selected.plan.validityDays !== null ? `${selected.plan.validityDays} days` : "30 days"}
              isDark={isDark}
            />
            <SummaryRow label="Tax" value="$0.00" isDark={isDark} />
            <View style={[styles.totalRow, isDark ? styles.totalRowDark : styles.totalRowLight]}>
              <Text style={[styles.totalLabel, isDark && styles.textLight]}>Total due</Text>
              <Text style={styles.totalVal}>{formatUsd(pricing.total)}</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>PAYMENT METHOD</Text>
          <View style={[styles.tabBar, isDark ? styles.tabBarDark : styles.tabBarLight]}>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setMethod("mpesa");
              }}
              style={({ pressed }) => [
                styles.tab,
                method === "mpesa" && (isDark ? styles.tabActiveDark : styles.tabActiveLight),
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  method === "mpesa" ? (isDark ? styles.tabLabelActiveDark : styles.tabLabelActive) : styles.tabLabelOff,
                ]}
              >
                M-Pesa
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setMethod("card");
              }}
              style={({ pressed }) => [
                styles.tab,
                method === "card" && (isDark ? styles.tabActiveDark : styles.tabActiveLight),
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  method === "card" ? (isDark ? styles.tabLabelActiveDark : styles.tabLabelActive) : styles.tabLabelOff,
                ]}
              >
                Card
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setMethod("wallet");
              }}
              style={({ pressed }) => [
                styles.tab,
                method === "wallet" && (isDark ? styles.tabActiveDark : styles.tabActiveLight),
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  method === "wallet" ? (isDark ? styles.tabLabelActiveDark : styles.tabLabelActive) : styles.tabLabelOff,
                ]}
              >
                Wallet
              </Text>
            </Pressable>
          </View>

          {method === "mpesa" ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>M-PESA PHONE NUMBER</Text>
              <TextInput
                value={mpesaPhone}
                onChangeText={setMpesaPhone}
                placeholder="0712 345 678 or 2547XXXXXXXX"
                placeholderTextColor={placeholder}
                keyboardType="phone-pad"
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                autoCorrect={false}
              />
              <Text style={[styles.fieldHint, isDark && styles.fieldHintDark]}>
                Safaricom number registered for M-Pesa
              </Text>
            </View>
          ) : method === "card" ? (
            <View className="" style={styles.fieldBlock}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>NAME ON CARD</Text>
                <TextInput
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="John Kamau"
                  placeholderTextColor={placeholder}
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>CARD NUMBER</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardGroups(t))}
                  placeholder="XXXX  XXXX  XXXX  XXXX"
                  placeholderTextColor={placeholder}
                  keyboardType="number-pad"
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                />
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.fieldWrapHalf}>
                  <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>EXPIRY</Text>
                  <TextInput
                    value={cardExpiry}
                    onChangeText={(t) => setCardExpiry(formatExpiryInput(t))}
                    placeholder="MM / YY"
                    placeholderTextColor={placeholder}
                    keyboardType="number-pad"
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  />
                </View>
                <View style={styles.fieldWrapHalf}>
                  <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>CVV</Text>
                  <TextInput
                    value={cardCvv}
                    onChangeText={(t) => setCardCvv(digitsOnly(t).slice(0, 4))}
                    placeholder="• • •"
                    placeholderTextColor={placeholder}
                    keyboardType="number-pad"
                    secureTextEntry
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex flex-col gap-2" style={styles.walletMethods}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setWalletProvider("google");
                }}
                className="flex flex-row items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-2xl"
                style={({ pressed }) => [
                  styles.walletMethod,
                  isDark ? styles.walletMethodDark : styles.walletMethodLight,
                  walletProvider === "google" && styles.walletMethodActive,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View
                  style={[
                    styles.walletIcon,
                    walletProvider === "google" && styles.walletIconActive,
                    { backgroundColor: walletProvider === "google" ? "#2563EB" : isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)" },
                  ]}
                >
                  <Text style={styles.walletIconText}>G</Text>
                </View>
                <View style={styles.walletInfo}>
                  <Text style={[styles.walletName, isDark && styles.textLight]}>Google Pay</Text>
                  <Text style={[styles.walletSub, isDark && styles.textMuted]}>Fast & secure one-tap</Text>
                </View>
                <View
                  style={[
                    styles.walletCheck,
                    isDark ? styles.walletCheckDark : styles.walletCheckLight,
                    walletProvider === "google" && styles.walletCheckActive,
                  ]}
                >
                  {walletProvider === "google" ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setWalletProvider("apple");
                }}
                className=" flex flex-row items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-2xl"
                style={({ pressed }) => [
                  styles.walletMethod,
                  isDark ? styles.walletMethodDark : styles.walletMethodLight,
                  walletProvider === "apple" && styles.walletMethodActive,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View
                  style={[
                    styles.walletIcon,
                    walletProvider === "apple" && styles.walletIconActive,
                    { backgroundColor: walletProvider === "apple" ? "#2563EB" : isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)" },
                  ]}
                >
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={walletProvider === "apple" ? "#fff" : isDark ? "#94A3B8" : "#475569"}
                  />
                </View>
                <View style={styles.walletInfo}>
                  <Text style={[styles.walletName, isDark && styles.textLight]}>Apple Pay</Text>
                  <Text style={[styles.walletSub, isDark && styles.textMuted]}>One-tap checkout</Text>
                </View>
                <View
                  style={[
                    styles.walletCheck,
                    isDark ? styles.walletCheckDark : styles.walletCheckLight,
                    walletProvider === "apple" && styles.walletCheckActive,
                  ]}
                >
                  {walletProvider === "apple" ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
              </Pressable>
            </View>
          )}

          <View style={styles.trustRow}>
            <View className="flex flex-row items-center gap-2">
              <Ionicons name="shield-checkmark-outline" size={14} color={isDark ? "#64748B" : "#94A3B8"} />
              <Text style={[styles.trustText, isDark && styles.textMuted]}>256-bit encrypted secure payment gateway</Text>
            </View>
            <Text style={[styles.trustText, isDark && styles.textMuted]}>Receipt to {user?.email ?? "your account"}</Text>
          </View>
        </>
      ) : successId ? (
        <View style={styles.successBody}>
          <View style={[styles.successRing, isDark ? styles.successRingDark : styles.successRingLight]}>
            <Ionicons name="checkmark" size={32} color="#0D7A4E" />
          </View>
          <Text style={[styles.successHeadline, isDark && styles.textLight]}>Purchase confirmed</Text>
          <Text style={[styles.successSub, isDark && styles.textMuted]}>Your eSIM is ready to activate</Text>
          <View style={[styles.orderRefChip, isDark ? styles.orderRefChipDark : styles.orderRefChipLight]}>
            <Text style={[styles.orderRefText, isDark && styles.textMuted]}>ORDER {successId}</Text>
          </View>

          <View style={styles.successActions}>
            <Pressable
              onPress={() => {
                onClose();
                router.replace("/(app)");
              }}
              style={({ pressed }) => [styles.btnHome, pressed && { opacity: 0.92 }]}
            >
              <LinearGradient
                colors={["#2563EB", "#1D4ED8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnHomeInner}
              >
                <Text style={styles.btnHomeText}>Back to home</Text>
                <Ionicons name="home-outline" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                router.replace("/(app)/profile");
              }}
              style={({ pressed }) => [
                styles.btnProfile,
                isDark ? styles.btnProfileDark : styles.btnProfileLight,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.btnProfileText, isDark && styles.textLight]}>View profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                clearSelection();
                onClose();
              }}
            >
              <Text style={[styles.btnLink, isDark && { color: "#93C5FD" }]}>Buy another plan</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </AppBottomSheet>
  );
}

function SummaryRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
      <Text style={[styles.summaryRowLabel, isDark && styles.textMuted]}>{label}</Text>
      <Text style={[styles.summaryRowVal, isDark && styles.textLight]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  textLight: { color: "#F8FAFC" },
  textMuted: { color: "rgba(148,163,184,0.85)" },

  heroCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  heroOrbLg: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -20,
    right: -20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroOrbSm: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    right: 20,
    bottom: -30,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroName: {
    fontSize: 17,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statVal: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  statLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  heroPrice: {
    position: "absolute",
    top: 16,
    right: 16,
    fontSize: 22,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1.2,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sectionLabelDark: { color: "rgba(148,163,184,0.7)" },

  summaryCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 0.5,
  },
  summaryCardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.08)",
  },
  summaryCardDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(15,23,42,0.06)",
  },
  summaryRowDark: {
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  summaryRowLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  summaryRowVal: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0F172A",
    flex: 1,
    textAlign: "right",
    paddingLeft: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  totalRowLight: {
    backgroundColor: "rgba(15,23,42,0.02)",
  },
  totalRowDark: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  totalVal: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2563EB",
  },

  tabBar: {
    flexDirection: "row",
    gap: 6,
    padding: 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  tabBarLight: {
    backgroundColor: "rgba(15,23,42,0.04)",
  },
  tabBarDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tab: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActiveLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "rgba(15,23,42,0.08)",
  },
  tabActiveDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#2563EB",
  },
  tabLabelActiveDark: {
    color: "#60A5FA",
  },
  tabLabelOff: {
    color: "#64748B",
  },

  fieldBlock: {
    marginBottom: 8,
    gap: 8,
  },
  fieldWrap: {
    gap: 5,
  },
  fieldWrapHalf: {
    flex: 1,
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#64748B",
    textTransform: "uppercase",
  },
  fieldLabelDark: {
    color: "rgba(148,163,184,0.75)",
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "400",
    borderWidth: 0.5,
  },
  inputLight: {
    backgroundColor: "rgba(15,23,42,0.02)",
    borderColor: "rgba(15,23,42,0.08)",
    color: "#0F172A",
  },
  inputDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    color: "#F8FAFC",
  },
  inputGroup: {
    flexDirection: "row",
    gap: 8,
  },
  fieldHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  fieldHintDark: {
    color: "rgba(148,163,184,0.65)",
  },

  walletMethods: {
    gap: 8,
    marginBottom: 4,
  },
  walletMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  walletMethodLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.08)",
  },
  walletMethodDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  walletMethodActive: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "rgba(37,99,235,0.05)",
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  walletIconActive: {
    backgroundColor: "#2563EB",
  },
  walletIconText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  walletInfo: {
    flex: 1,
    minWidth: 0,
  },
  walletName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  walletSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  walletCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  walletCheckLight: {
    borderColor: "rgba(15,23,42,0.12)",
  },
  walletCheckDark: {
    borderColor: "rgba(255,255,255,0.15)",
  },
  walletCheckActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  trustRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
    paddingBottom: 8,
    textAlign: "center",
  },
  trustText: {
    fontSize: 11,
    color: "#64748B",
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(15,23,42,0.2)",
  },
  trustDotDark: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  footerStack: { gap: 10 },
  payBtn: { borderRadius: 14, overflow: "hidden" },
  payBtnDisabled: { opacity: 0.85 },
  payGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    height: 52,
  },
  payBtnText: { color: "#fff", fontWeight: "500", fontSize: 16 },
  changePlan: { textAlign: "center", fontSize: 12, fontWeight: "500", color: "#2563EB", paddingVertical: 6 },

  successBody: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    gap: 0,
  },
  successRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successRingLight: {
    borderColor: "rgba(15,23,42,0.12)",
    backgroundColor: "rgba(15,23,42,0.02)",
  },
  successRingDark: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  successHeadline: {
    fontSize: 22,
    fontWeight: "500",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  orderRefChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    marginBottom: 24,
  },
  orderRefChipLight: {
    backgroundColor: "rgba(15,23,42,0.02)",
    borderColor: "rgba(15,23,42,0.08)",
  },
  orderRefChipDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  orderRefText: {
    fontSize: 11,
    color: "#64748B",
    letterSpacing: 0.5,
  },
  successActions: {
    width: "100%",
    gap: 10,
  },
  btnHome: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  btnHomeInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    height: 50,
  },
  btnHomeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  btnProfile: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
  },
  btnProfileLight: {
    backgroundColor: "rgba(15,23,42,0.02)",
    borderColor: "rgba(15,23,42,0.08)",
  },
  btnProfileDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  btnProfileText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0F172A",
  },
  btnLink: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
    paddingVertical: 6,
    textAlign: "center",
  },
});
