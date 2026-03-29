import {
  View,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../../components/Text";
import { LabeledInput } from "../../components/LabeledInput";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useRouter, Link } from "expo-router";
import { useState } from "react";

import { useAuthStore } from "../../store/authStore";
import { login as loginApi, loginWithProvider } from "../../services/auth";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import React from "react";
import { useColorScheme } from "nativewind";
import { ThemeToggle } from "../../components/ThemeToggle";
import { StatusBar } from "expo-status-bar";

const schema = z.object({
  email_or_phone: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setTokens = useAuthStore((s) => s.setTokens);

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(
    null
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await loginApi(data);
      await setTokens(res.accessToken, res.refreshToken, res.user);
      router.replace("/(app)");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
            : null;
      setApiError(message ?? "Invalid credentials. Please try again.");
    }
  };

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSubmit(onSubmit)();
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setApiError(null);
    setSocialLoading(provider);
    try {
      const res = await loginWithProvider(provider);
      await setTokens(res.accessToken, res.refreshToken, res.user);
      router.replace("/(app)");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
      setApiError(message);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
    >
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor="transparent"
        translucent
      />
      {/* Multi-layer background for depth */}
      <LinearGradient
        colors={
          isDark
            ? ["#0a0a0f", "#111827", "#17171a"]
            : ["#ffffff", "#f8f9fa", "#f1f5f9"]
        }
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow top-right */}
      <View
        style={[
          styles.glowTopRight,
          !isDark && { backgroundColor: "rgba(59,130,246,0.10)" },
        ]}
        pointerEvents="none"
      />
      {/* Radial glow bottom-left */}
      <View
        style={[
          styles.glowBottomLeft,
          !isDark && { backgroundColor: "rgba(129,140,248,0.10)" },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(700).springify()}
          style={styles.heroSection}
        >
          <View style={styles.heroHeader}>
            {/* Logo */}
            <View >
              {isDark ? (
                <Image
                  source={require("../../assets/icon2dark.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("../../assets/icon2.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
            </View>
            <ThemeToggle />
          </View>

          <Text style={[styles.heroTitle, !isDark && { color: "#0f172a" }]}>
            Welcome back !
          </Text>
          <Text
            style={[styles.heroSubtitle, !isDark && { color: "rgba(71,85,105,0.9)" }]}
          >
            Manage eSIMs, data packs, and roaming in minutes.
          </Text>
        </Animated.View>

        {/* Glass Card */}
        <Animated.View
          entering={FadeIn.duration(600).delay(200)}
          style={[
            styles.glassCard,
            !isDark && {
              backgroundColor: "rgba(255,255,255,0.96)",
              borderColor: "rgba(15,23,42,0.06)",
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradientBorder}
          />

          {apiError && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[
                styles.errorBanner,
                !isDark && {
                  backgroundColor: "rgba(254,242,242,1)",
                  borderColor: "rgba(248,113,113,0.8)",
                },
              ]}
            >
              <Ionicons name="alert-circle" size={17} color="#f87171" />
              <Text style={styles.errorText}>{apiError}</Text>
            </Animated.View>
          )}

          {/* Email */}
          <Controller
            control={control}
            name="email_or_phone"
            render={({ field: { onChange, value } }) => (
              <LabeledInput
                label="Your Email or Phone"
                labelClassName="mb-1.5"
                placeholder="you@example.com"
                placeholderTextColor="rgba(148,163,184,0.4)"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={errors.email_or_phone?.message}
                inputClassName="h-13 text-base"
                inputWrapperClassName="rounded-xl px-4"
                containerClassName="mb-5"
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <LabeledInput
                label="Account Password"
                labelClassName="mb-1.5"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(148,163,184,0.4)"
                errorText={errors.password?.message}
                inputClassName="h-13 text-base"
                inputWrapperClassName="rounded-2xl px-4"
                containerClassName="mb-2"
                rightAccessory={
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="rgba(148,163,184,0.7)"
                    />
                  </Pressable>
                }
              />
            )}
          />

          {/* CTA Button */}
          <Pressable
            onPress={handleLoginPress}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.ctaWrapper,
              pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
            ]}
          >
            <LinearGradient
              colors={["#3B82F6", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >

              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Sign In</Text>
                  <View style={styles.ctaArrow}>
                    <Ionicons name="arrow-forward" size={15} color="#fff" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          entering={FadeIn.duration(400).delay(500)}
          style={styles.dividerRow}
        >
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerLabel, !isDark && { color: "rgba(71,85,105,0.55)" }]}>
            or continue with
          </Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Social buttons */}
        <Animated.View
          entering={FadeIn.duration(500).delay(400).springify()}
          className="mx-auto flex flex-row gap-3 mb-8 items-center justify-center"
        >
          {/* Google */}
          <Pressable
            className="flex-1 border border-gray-300 dark:border-gray-400 rounded-full"
            style={({ pressed }) => [
              styles.socialBtn,
              isDark ? styles.socialBtnDark : styles.socialBtnLight,
              pressed && styles.socialBtnPressed,
            ]}
            disabled={socialLoading !== null}
            onPress={() => handleSocialLogin("google")}
          >
            {/* Real Google "G" logo via SVG */}
            <View style={styles.socialBtnInner}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <Path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <Path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </Svg>
              <Text style={[styles.socialBtnText, !isDark && styles.socialBtnTextLight]}>
                {socialLoading === "google" ? "Connecting…" : "Google"}
              </Text>
            </View>
          </Pressable>

          {/* Apple */}
          <Pressable
            className="flex-1 border border-gray-300 dark:border-gray-400 rounded-full"
            style={({ pressed }) => [
              styles.socialBtn,
              isDark ? styles.socialBtnDark : styles.socialBtnLight,
              pressed && styles.socialBtnPressed,
            ]}
            disabled={socialLoading !== null}
            onPress={() => handleSocialLogin("apple")}
          >
            <View style={styles.socialBtnInner}>
              <Ionicons
                name="logo-apple"
                size={18}
                color={isDark ? "#FFFFFF" : "#0f172a"}
              />
              <Text style={[styles.socialBtnText, !isDark && styles.socialBtnTextLight]}>
                {socialLoading === "apple" ? "Connecting…" : "Apple"}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.duration(400).delay(600)}
          style={styles.footer}
        >
          <Text
            style={[
              styles.footerText,
              !isDark && { color: "rgba(100,116,139,0.9)" },
            ]}
          >
            Don't have an account?{" "}
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text
                  style={[
                    styles.footerLink,
                    !isDark && { color: "#1D4ED8" },
                  ]}
                >
                  Create one
                </Text>
              </Pressable>
            </Link>
          </Text>
        </Animated.View>

        <Link href="/(onboarding)" asChild>
          <Pressable>
            <Text
              style={[
                styles.footerLink,
                styles.textCenter,
                !isDark && { color: "#1D4ED8" },
              ]}
            >
              Go to onboarding
            </Text>
          </Pressable>
        </Link>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  textCenter: { textAlign: "center" },

  glowTopRight: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(59,130,246,0.18)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  heroSection: {
    paddingTop: 120,
    paddingBottom: 30,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 180,
    height: 70,
  },
  heroTitle: {
    fontSize: 29,
    fontWeight: "800",
    color: "#F8FAFC",
    lineHeight: 50,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(148,163,184,0.8)",
    fontWeight: "400",
    letterSpacing: 0.1,
    marginLeft: 5,
  },

  glassCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardGradientBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    opacity: 0.5,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    flex: 1,
  },

  ctaWrapper: {
    height: 50,
    borderRadius: 140,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 8,
  },
  ctaGradient: {
    height: 50,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 140,
    overflow: "hidden",
    position: "relative",
  },

  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ctaArrow: {
    width: 24,
    height: 24,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  dividerText: {
    fontSize: 12,
    fontWeight: "600",
  },


  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(148,163,184,0.35)",
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(148,163,184,0.7)",
    letterSpacing: 0.4,
  },


  socialBtn: {
    overflow: "hidden",
  },
  socialBtnDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  socialBtnLight: {
    backgroundColor: "#ffffff",
  },
  socialBtnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  socialBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  socialBtnText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  socialBtnTextLight: {
    color: "#0f172a",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,

  },
  footerText: {
    color: "rgba(148,163,184,0.6)",
    fontSize: 13.5,
  },
  footerLink: {
    color: "#93C5FD",
    fontSize: 13.5,
    fontWeight: "600",
  },


});
