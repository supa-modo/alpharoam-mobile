import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

/** Masked PAN for preview: bullets except the last up to four digits. */
function formatMaskedPan(raw: string): string {
  const d = digitsOnly(raw).slice(0, 19);
  if (d.length === 0) return "••••  ••••  ••••  ••••";
  const chars: string[] = [];
  for (let i = 0; i < d.length; i++) {
    chars.push(d.length > 4 && i < d.length - 4 ? "•" : d[i]!);
  }
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += 4) {
    parts.push(chars.slice(i, i + 4).join(""));
  }
  return parts.join("  ");
}

function inferCardBrandLabel(raw: string): string | null {
  const d = digitsOnly(raw);
  if (d.length === 0) return null;
  if (d.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(?:011|5)/.test(d)) return "Discover";
  return null;
}

type CardFieldFocus = "number" | "name" | "expiry" | "cvv" | null;

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
  const [cardFieldFocus, setCardFieldFocus] = useState<CardFieldFocus>(null);
  const [mpesaFieldFocused, setMpesaFieldFocused] = useState(false);
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
      setCardFieldFocus(null);
      setMpesaFieldFocused(false);
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
                <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#fff" />
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
{/* 
          <View style={[styles.summaryCard, isDark ? styles.summaryCardDark : styles.summaryCardLight]}>
            <SummaryRow label="Plan" value={selected.plan.name} isDark={isDark} />

            <SummaryRow label="Tax" value="$0.00" isDark={isDark} />
            <View style={[styles.totalRow, isDark ? styles.totalRowDark : styles.totalRowLight]}>
              <Text style={[styles.totalLabel, isDark && styles.textLight]}>Total due</Text>
              <Text style={styles.totalVal}>{formatUsd(pricing.total)}</Text>
            </View>
          </View> */}

          <Text style={[styles.sectionLabel, styles.sectionLabelPad, isDark && styles.sectionLabelDark]}>
            PAYMENT METHOD
          </Text>
          <View className="flex flex-row gap-2.5 justify-between" style={[styles.methodTabBar, isDark ? styles.methodTabBarDark : styles.methodTabBarLight]}>
          <Pressable
          className="w-[1/3] flex py-3 px-4 items-center justify-center"
            
  onPress={() => {
    void Haptics.selectionAsync();
    setMethod("mpesa");
  }}
  style={({ pressed }) => [
    styles.methodTab,
    method === "mpesa" && (isDark ? styles.methodTabActiveDark : styles.methodTabActiveLight),
    pressed && { opacity: 0.9 },
  ]}
>
              <View style={styles.methodTabInner}>
                <MpesaIcon width={60} height={20} />
                
              </View>
            </Pressable>
            <Pressable
            className="w-[1/3] flex py-3 px-4 items-center justify-center"
              onPress={() => {
                void Haptics.selectionAsync();
                setMethod("card");
              }}
              style={({ pressed }) => [
                styles.methodTab,
                method === "card" && (isDark ? styles.methodTabActiveDark : styles.methodTabActiveLight),
                pressed && { opacity: 0.9 },
              ]}
            >
              <View className="flex flex-row gap-2" style={styles.methodTabInner}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={method === "card" ? (isDark ? "#60A5FA" : "#2563EB") : "#64748B"}
                />
                <Text
                  style={[
                    styles.methodTabCaption,
                    method === "card"
                      ? isDark
                        ? styles.tabLabelActiveDark
                        : styles.tabLabelActive
                      : styles.tabLabelOff,
                  ]}
                >
                  Card
                </Text>
              </View>
            </Pressable>
            <Pressable
            className="w-[1/3] flex py-3 px-4 px-auto items-center justify-center"
              onPress={() => {
                void Haptics.selectionAsync();
                setMethod("wallet");
              }}
              style={({ pressed }) => [
                styles.methodTab,
                method === "wallet" && (isDark ? styles.methodTabActiveDark : styles.methodTabActiveLight),
                pressed && { opacity: 0.9 },
              ]}
            >
              <View className="flex flex-row gap-2" style={styles.methodTabInner}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={method === "wallet" ? (isDark ? "#60A5FA" : "#2563EB") : "#64748B"}
                />
                <Text
                  style={[
                    styles.methodTabCaption,
                    method === "wallet"
                      ? isDark
                        ? styles.tabLabelActiveDark
                        : styles.tabLabelActive
                      : styles.tabLabelOff,
                  ]}
                >
                  Wallet
                </Text>
              </View>
            </Pressable>
          </View>

          {method === "mpesa" ? (
            <View
              style={[
                styles.cardPanel,
                isDark ? styles.cardPanelDark : styles.cardPanelLight,
              ]}
            >
              <LinearGradient
                colors={["#022c22", "#064e3b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mpesaPreview}
              >
                <View style={styles.mpesaPreviewTop}>
                  <MpesaIcon width={84} height={24} variant="white" />
                </View>
                <Text style={styles.mpesaPreviewSub}>STK Push to your Safaricom Mpesa line</Text>
              </LinearGradient>
              <View style={styles.cardFormInner}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.cardFieldLabel, isDark && styles.cardFieldLabelDark]}>Phone number</Text>
                  <TextInput
                    value={mpesaPhone}
                    onChangeText={setMpesaPhone}
                    placeholder="0712 345 678 or 2547XXXXXXXX"
                    placeholderTextColor={placeholder}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    onFocus={() => setMpesaFieldFocused(true)}
                    onBlur={() => setMpesaFieldFocused(false)}
                    className="border"
                    style={[
                      isDark ? styles.inputDark : styles.inputLight,
                      styles.cardInputPrimary,
                      mpesaFieldFocused && (isDark ? styles.inputFocusedDark : styles.inputFocusedLight),
                      Platform.OS === "ios" && { fontVariant: ["tabular-nums"] as const },
                    ]}
                  />
                </View>
                <Text style={[styles.mpesaFieldHint, isDark && styles.fieldHintDark]}>
                  Use your registered Safaricom Mpesa number
                </Text>
              </View>
            </View>
          ) : method === "card" ? (
            <View
              style={[
                styles.cardPanel,
                isDark ? styles.cardPanelDark : styles.cardPanelLight,
              ]}
            >
              <LinearGradient
                colors={["#0B1220", "#1E293B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardPreview}
              >
                <View style={styles.cardPreviewHeader}>
                  <View style={styles.cardBrandMarks}>
                    <FontAwesome name="cc-mastercard" size={30} color="rgba(255,255,255,0.95)" />
                    <FontAwesome name="cc-visa" size={28} color="rgba(255,255,255,0.95)" style={styles.cardBrandMarkVisa} />
                  </View>
                  <MaterialCommunityIcons
                    name="contactless-payment"
                    size={22}
                    color="rgba(255,255,255,0.6)"
                  />
                </View>
                <Text
                  style={styles.cardPreviewPan}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {formatMaskedPan(cardNumber)}
                </Text>
                <Text style={styles.cardPreviewBrand} numberOfLines={1}>
                  {inferCardBrandLabel(cardNumber) ?? "Debit or credit"}
                </Text>
              </LinearGradient>

              <View style={styles.cardFormInner}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.cardFieldLabel, isDark && styles.cardFieldLabelDark]}>Card number</Text>
                  <TextInput
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(formatCardGroups(t))}
                    placeholder="4242  4242  4242  4242"
                    placeholderTextColor={placeholder}
                    keyboardType="number-pad"
                    onFocus={() => setCardFieldFocus("number")}
                    onBlur={() => setCardFieldFocus(null)}
                    className="border"
                    style={[
                      isDark ? styles.inputDark : styles.inputLight,
                      styles.cardInputPrimary,
                      cardFieldFocus === "number" &&
                        (isDark ? styles.inputFocusedDark : styles.inputFocusedLight),
                      Platform.OS === "ios" && { fontVariant: ["tabular-nums"] as const },
                    ]}
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.cardFieldLabel, isDark && styles.cardFieldLabelDark]}>Name on card</Text>
                  <TextInput
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="John Kamau"
                    placeholderTextColor={placeholder}
                    autoCapitalize="words"
                    onFocus={() => setCardFieldFocus("name")}
                    onBlur={() => setCardFieldFocus(null)}
                    className="border"
                    style={[
                      styles.cardInputPrimary,
                      isDark ? styles.inputDark : styles.inputLight,
                      cardFieldFocus === "name" &&
                        (isDark ? styles.inputFocusedDark : styles.inputFocusedLight),
                    ]}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.fieldWrapHalf}>
                    <Text style={[styles.cardFieldLabel, isDark && styles.cardFieldLabelDark]}>Expiry</Text>
                    <TextInput
                      value={cardExpiry}
                      onChangeText={(t) => setCardExpiry(formatExpiryInput(t))}
                      placeholder="MM / YY"
                      placeholderTextColor={placeholder}
                      keyboardType="number-pad"
                      onFocus={() => setCardFieldFocus("expiry")}
                      onBlur={() => setCardFieldFocus(null)}
                      className="border"
                      style={[
                        styles.input,
                        isDark ? styles.inputDark : styles.inputLight,
                        cardFieldFocus === "expiry" &&
                          (isDark ? styles.inputFocusedDark : styles.inputFocusedLight),
                        Platform.OS === "ios" && { fontVariant: ["tabular-nums"] as const },
                      ]}
                    />
                  </View>
                  <View style={styles.fieldWrapHalf}>
                    <Text style={[styles.cardFieldLabel, isDark && styles.cardFieldLabelDark]}>CVV</Text>
                    <TextInput
                      value={cardCvv}
                      onChangeText={(t) => setCardCvv(digitsOnly(t).slice(0, 4))}
                      placeholder="• • •"
                      placeholderTextColor={placeholder}
                      keyboardType="number-pad"
                      secureTextEntry
                      onFocus={() => setCardFieldFocus("cvv")}
                      onBlur={() => setCardFieldFocus(null)}
                      className="border"
                      style={[
                        styles.input,
                        isDark ? styles.inputDark : styles.inputLight,
                        cardFieldFocus === "cvv" &&
                          (isDark ? styles.inputFocusedDark : styles.inputFocusedLight),
                        Platform.OS === "ios" && { fontVariant: ["tabular-nums"] as const },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.cardPanel,
                isDark ? styles.cardPanelDark : styles.cardPanelLight,
              ]}
            >
              <LinearGradient
                colors={["#0B1220", "#1E293B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex flex-row items-center gap-4"
                style={styles.walletPreview}
              >
                <View style={styles.walletPreviewIconRow}>
                  <MaterialCommunityIcons name="wallet-outline" size={32} color="rgba(255,255,255,0.9)" />
                </View>
                <View className="flex flex-col items-start ">
                <Text style={styles.walletPreviewTitle}>Digital wallet</Text>
                <Text style={styles.walletPreviewSub}>One-tap checkout with your saved card</Text></View>
              </LinearGradient>

              <View style={styles.walletList}>
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
                      styles.walletGoogleMarkWrap,
                      isDark ? styles.walletGoogleMarkWrapDark : styles.walletGoogleMarkWrapLight,
                    ]}
                  >
                    <FontAwesome5 name="google-pay" size={22} brand />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, isDark && styles.textLight]}>Google Pay</Text>
                    <Text style={[styles.walletSub, isDark && styles.textMuted]}>Fast and secure one-tap</Text>
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
                  className="flex flex-row items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-2xl"
                  style={({ pressed }) => [
                    styles.walletMethod,
                    isDark ? styles.walletMethodDark : styles.walletMethodLight,
                    walletProvider === "apple" && styles.walletMethodActive,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <View
                    style={[
                      styles.walletAppleIconWrap,
                      walletProvider === "apple"
                        ? styles.walletAppleIconWrapActive
                        : isDark
                          ? styles.walletAppleIconWrapIdleDark
                          : styles.walletAppleIconWrapIdleLight,
                    ]}
                  >
                    <Ionicons
                      name="logo-apple"
                      size={22}
                      color={walletProvider === "apple" ? "#fff" : isDark ? "#94A3B8" : "#475569"}
                    />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, isDark && styles.textLight]}>Apple Pay</Text>
                    <Text style={[styles.walletSub, isDark && styles.textMuted]}>Face ID or Touch ID checkout</Text>
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
            </View>
          )}

          <View style={styles.trustRow}>
            <View className="flex flex-row items-center gap-2">
              <Ionicons name="shield-checkmark-outline" size={14} color={isDark ? "#64748B" : "#94A3B8"} />
              <Text style={[styles.trustText, isDark && styles.textMuted]}>256-bit encrypted secure payment gateway</Text>
            </View>
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

                <Ionicons name="home-outline" size={18} color="#fff" />
                <Text style={styles.btnHomeText}>Back to home</Text>
              </LinearGradient>
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
    borderRadius: 24,
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
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  statLbl: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  heroPrice: {
    position: "absolute",
    top: 16,
    right: 16,
    fontSize: 22,
    fontWeight: "900",
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
  sectionLabelPad: { paddingLeft: 8 },

  summaryCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 0.5,
  },
  summaryCardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.15)",
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
    backgroundColor: "rgba(15,23,42,0.15)",
  },
  totalRowDark: {
    backgroundColor: "rgba(255,255,255,0.15)",
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

  methodTabBar: {
    flexDirection: "row",
    alignSelf: "stretch",
    width: "100%",
    padding: 4,
    gap: 10,
    borderRadius: 16,
    marginBottom: 14,
    // Hairline is often 0 on Android — use 1px so the rail reads on device.
    borderWidth: Platform.OS === "android" ? 1 : StyleSheet.hairlineWidth,
  },
  methodTabBarLight: {
    backgroundColor: "rgba(15,23,42,0.01)",
    borderColor: "rgba(15,23,42,0.1)",
  },
  methodTabBarDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  methodTab: {
    flex: 1,              // ← replaces w-[1/3], works correctly in RN
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    borderRadius: 12,
  },
  methodTabActiveLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: Platform.OS === "android" ? 1 : StyleSheet.hairlineWidth,
    borderColor: "rgba(37,99,235,0.25)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  methodTabActiveDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: Platform.OS === "android" ? 1 : StyleSheet.hairlineWidth,
    borderColor: "rgba(96,165,250,0.35)",
  },
  methodTabInner: {
    alignItems: "center",
    
  },
  methodTabCaption: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
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

  mpesaPreview: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  mpesaPreviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  mpesaPreviewSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
  },
  mpesaFieldHint: {
    fontSize: 12,
    color: "#94A3B8",
    paddingLeft: 5,
    marginTop: -4,
  },

  cardPanel: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardPanelLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.22)",
  },
  cardPanelDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardPreview: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cardPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardBrandMarks: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardBrandMarkVisa: {
    marginLeft: 12,
  },
  cardPreviewPan: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(248,250,252,0.95)",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardPreviewBrand: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(148,163,184,0.88)",
    letterSpacing: 0.3,
  },
  cardFormInner: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
  },
  cardFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 2,
    paddingLeft: 4,
  },
  cardFieldLabelDark: {
    color: "rgba(148,163,184,0.88)",
  },
  cardInputPrimary: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
  inputFocusedLight: {
    borderColor: "#2563EB",
    borderWidth: 1,
  },
  inputFocusedDark: {
    borderColor: "#60A5FA",
    borderWidth: 1,
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
    paddingLeft: 8,
  },
  fieldLabelDark: {
    color: "rgba(148,163,184,0.75)",
  },
  input: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "400",
    borderWidth: 0.5,
  },
  inputLight: {
    backgroundColor: "rgba(15,23,42,0.08)",
    borderColor: "rgba(15,23,42,0.1)",
    color: "#0F172A",
  },
  inputDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.2)",
    color: "#F8FAFC",
  },
  inputGroup: {
    flexDirection: "row",
    gap: 8,
  },
  fieldHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
    paddingLeft: 4,
  },
  fieldHintDark: {
    color: "rgba(148,163,184,0.65)",
  },

  walletPreview: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  walletPreviewIconRow: {
    marginBottom: 10,
  },
  walletPreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(248,250,252,0.96)",
    marginBottom: 4,
  },
  walletPreviewSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(148,163,184,0.9)",
  },
  walletList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  walletMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  walletMethodLight: {
    backgroundColor: "rgba(15,23,42,0.02)",
    borderColor: "rgba(15,23,42,0.1)",
  },
  walletMethodDark: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  walletMethodActive: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "rgba(37,99,235,0.06)",
  },
  walletGoogleMarkWrap: {
    width: 48,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  walletGoogleMarkWrapLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,23,42,0.08)",
  },
  walletGoogleMarkWrapDark: {
    backgroundColor: "rgba(248,250,252,0.98)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,23,42,0.12)",
  },
  walletAppleIconWrap: {
    width: 48,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  walletAppleIconWrapIdleLight: {
    backgroundColor: "rgba(15,23,42,0.06)",
  },
  walletAppleIconWrapIdleDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  walletAppleIconWrapActive: {
    backgroundColor: "#2563EB",
  },
  walletInfo: {
    flex: 1,
    minWidth: 0,
  },
  walletName: {
    fontSize: 15,
    fontWeight: "600",
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
    marginTop: 7,
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
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    height: 49,
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  changePlan: { textAlign: "center", fontSize: 12, fontWeight: "600", color: "#2563EB", paddingVertical: 6 },

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
    marginBottom: 4,
  },
  btnHomeInner: {
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    height: 48,
  },
  btnHomeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  btnLink: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
    paddingVertical: 6,
    textAlign: "center",
  },
});
