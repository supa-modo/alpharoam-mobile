import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";

import { Text } from "../Text";

const { height: SCREEN_H } = Dimensions.get("window");

export type AppBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Used when `fitContent` is false. */
  heightRatio?: number;
  /** Size sheet from scroll content height, clamped between `minHeightRatio` and `maxHeightRatio`. */
  fitContent?: boolean;
  minHeightRatio?: number;
  maxHeightRatio?: number;
  title: string;
  subtitle?: string;
  accentColor?: string;
  accentColors?: [string, string];
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  /** When false, backdrop press does nothing (e.g. during submitting). */
  dismissible?: boolean;
};

const TOP_CHROME = 132;
const FOOTER_CHROME = 96;
const FOOTER_CHROME_COLLAPSED = 28;

export function AppBottomSheet({
  visible,
  onClose,
  heightRatio = 0.88,
  fitContent = false,
  minHeightRatio = 0.6,
  maxHeightRatio = 0.95,
  title,
  subtitle,
  accentColor = "#3B82F6",
  accentColors,
  icon,
  children,
  footer,
  closeOnBackdrop = true,
  dismissible = true,
}: AppBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [scrollContentH, setScrollContentH] = useState(0);
  const prevVisible = useRef(false);

  useEffect(() => {
    if (!visible) setScrollContentH(0);
  }, [visible]);

  const sheetHeight = useMemo(() => {
    const maxH = SCREEN_H * maxHeightRatio;
    if (fitContent) {
      const minH = SCREEN_H * minHeightRatio;
      const foot = footer ? FOOTER_CHROME : FOOTER_CHROME_COLLAPSED;
      const inner = TOP_CHROME + foot + scrollContentH + Math.min(insets.bottom, 20);
      return Math.min(maxH, Math.max(minH, inner));
    }
    return Math.min(SCREEN_H * heightRatio, maxH);
  }, [
    fitContent,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    scrollContentH,
    footer,
    insets.bottom,
  ]);

  const translateY = useSharedValue(SCREEN_H);
  const backdropOpacity = useSharedValue(0);

  const gradientColors: [string, string] = accentColors ?? [accentColor, accentColor];

  useEffect(() => {
    if (visible && !prevVisible.current) {
      backdropOpacity.value = withTiming(1, { duration: 280 });
      translateY.value = sheetHeight;
      translateY.value = withSpring(0, {
        damping: 26,
        stiffness: 260,
        mass: 0.9,
      });
    } else if (!visible && prevVisible.current) {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(sheetHeight, { duration: 300 });
    }
    prevVisible.current = visible;
  }, [visible, sheetHeight]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const canDismiss = dismissible && closeOnBackdrop;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismissible ? onClose : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(2,11,24,0.96)" />
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={canDismiss ? onClose : undefined}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kvContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            isDark ? styles.sheetDark : styles.sheetLight,
            { height: sheetHeight },
            sheetStyle,
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, isDark && styles.handleDark]} />
          </View>

          <View style={styles.sheetHeader}>
            <View style={[styles.sheetHeaderLeft, { flex: 1 }]}>
              {icon ? (
                <LinearGradient colors={gradientColors} style={styles.sheetIconBg}>
                  <Ionicons name={icon} size={20} color="#fff" />
                </LinearGradient>
              ) : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sheetTitle, isDark && { color: "#F1F5F9" }]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.sheetSubtitle, isDark && { color: "#94A3B8" }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            {dismissible ? (
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, isDark && styles.closeBtnDark]}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </Pressable>
            ) : (
              <View style={{ width: 34 }} />
            )}
          </View>

          <View style={[styles.divider, isDark && styles.dividerDark]} />

          <View style={styles.body}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.sheetContent,
                { paddingBottom: footer ? 8 : insets.bottom + 20 },
              ]}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={
                fitContent
                  ? (_, h) => {
                      setScrollContentH(h);
                    }
                  : undefined
              }
            >
              {children}
            </ScrollView>
          </View>

          {footer ? (
            <View
              style={[
                styles.footer,
                isDark ? styles.footerDark : styles.footerLight,
                { paddingBottom: Math.max(insets.bottom, 12) },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(2,11,24,0.72)",
  },
  kvContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  sheetLight: {
    backgroundColor: "#F8FAFC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 30,
  },
  sheetDark: {
    backgroundColor: "#0D1B2E",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 30,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15,23,42,0.14)",
  },
  handleDark: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 16,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  sheetIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15,23,42,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15,23,42,0.1)",
    marginHorizontal: 24,
  },
  dividerDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15,23,42,0.08)",
  },
  footerLight: {
    backgroundColor: "#F8FAFC",
  },
  footerDark: {
    backgroundColor: "#0D1B2E",
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
