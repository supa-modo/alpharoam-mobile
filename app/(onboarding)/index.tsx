import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
  Platform,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../../components/Text";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { ThemeToggle } from "../../components/ThemeToggle";

const AnimatedText = Animated.createAnimatedComponent(Text);

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Roam Smarter\nAcross 190+ Countries",
    tag: "GLOBAL COVERAGE",
    description:
      "Activate eSIM data plans before you land and stay connected worldwide — no roaming fees.",
    image: require("../../assets/images/hero1.png"),
    accent: "#6C63FF",
    accentSoft: "#6C63FF22",
  },
  {
    title: "Instant Setup\nNo Physical SIMs Needed",
    tag: "ZERO HASSLE",
    description:
      "Install your eSIM in minutes directly from the app and keep your main number fully active.",
    image: require("../../assets/images/hero33.png"),
    accent: "#FF6B6B",
    accentSoft: "#FF6B6B22",
  },
  {
    title: "Flexible Plans\nThat Fit Your Journey",
    tag: "SMART PRICING",
    description:
      "Choose daily, weekly, or monthly packs with transparent pricing and real-time usage tracking.",
    image: require("../../assets/images/hero22.png"),
    accent: "#00C9A7",
    accentSoft: "#00C9A722",
  },

];

const AUTO_PLAY_INTERVAL = 5000;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [page, setPage] = useState(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollRef = useRef<ScrollView>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentSlide = SLIDES[page];

  const animateToPage = (nextPage: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setPage(nextPage);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    // Auto-play
    autoPlayRef.current = setInterval(() => {
      const next = (page + 1) % SLIDES.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      animateToPage(next);
    }, AUTO_PLAY_INTERVAL);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [page]);

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== page) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      animateToPage(index);
    }
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  const bg = isDark ? "#0A0A0F" : "#fff";
  const textPrimary = isDark ? "#FAFAFA" : "#0D0D1A";
  const textSecondary = isDark ? "#8888AA" : "#7070A0";
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Full-bleed image carousel */}
      <View style={styles.imageContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={StyleSheet.absoluteFill}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={{ width, height: height * 0.6 }}>
              <Image
                source={slide.image}
                style={{ width, height: height * 0.6 }}
                resizeMode="cover"
              />
              {/* Gradient overlay */}
              <LinearGradient
                colors={
                  isDark
                    ? ["transparent", "rgba(10,10,15, 0.65)", "rgba(10,10,15, 1)", bg]
                    : ["transparent", "rgba(255,255,255,0.8)", "rgba(255,255,255,1)", bg]
                }
                locations={[0, 0.4, 0.7, 1]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  height: height * 0.25,
                }}
              />
              {/* Top gradient for status bar */}
              <LinearGradient
                colors={isDark
                  ? [bg, "transparent"]
                  : [bg, "transparent"]
                }
                locations={[0, 1]}
                style={[StyleSheet.absoluteFill, { height: 150, bottom: undefined }]}
              />
            </View>
          ))}
        </ScrollView>

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>

          <View style={styles.topBarRight}>
            <ThemeToggle />
            {/* separate light border color for light mode */}
            <Pressable onPress={handleSkip} style={[styles.skipPill, { borderColor: isDark ? "#fff" : "rgba(0,0,0,0.4)" }]}>
              <Text style={[styles.skipText, { color: isDark ? "#fff" : "rgba(0,0,0,0.4)" }]}>Skip</Text>
            </Pressable>

          </View>
        </View>

        <Animated.View
          style={[
            styles.indicatorRow,
            { bottom: insets.bottom + 32 },
          ]}
        >
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];

            const animatedWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: "clamp",
            });

            const animatedOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.indicatorBar,
                  {
                    width: animatedWidth,
                    opacity: animatedOpacity,
                    backgroundColor: "#0061cf",
                    marginRight: 7,
                  },
                ]}
              />
            );
          })}
        </Animated.View>

      </View>

      {/* Content card */}
      <View style={[styles.contentCard, { backgroundColor: bg }]}>

        {/* Logo */}
        <View style={styles.logoRow} >
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

        {/* Headline */}
        <AnimatedText

          style={[
            styles.headline,
            {
              color: textPrimary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {currentSlide.title}
        </AnimatedText>

        {/* Description */}
        <AnimatedText
          style={[
            styles.description,
            {
              color: textSecondary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {currentSlide.description}
        </AnimatedText>

        {/* CTA Button */}
        <View style={{ marginTop: 24, paddingBottom: insets.bottom + 16 }}>
          <Pressable
            className="flex flex-row items-center justify-center border-2 border-primary-500 dark:border-primary-400 rounded-full py-3.5 gap-2 mt-auto"
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.ctaButton,
              {

                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...Platform.select({
                  ios: {
                    shadowColor: currentSlide.accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.45,
                    shadowRadius: 16,
                  },
                  android: { elevation: 10, backgroundColor: currentSlide.accent, },
                }),
              },
            ]}
          >
            <Text className="text-primary-500 dark:text-primary-400" style={[styles.ctaText]}>Continue</Text>
            <View >
              <Ionicons name="arrow-forward" size={16} color={isDark ? "#3383eb" : "#0064e6"} />
            </View>
          </Pressable>

          {/* Sign in link */}
          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.signinRow}>
            <Text style={[styles.signinText, { color: textSecondary }]}>
              Already have an account?{" "}
            </Text>
            <Text style={[styles.signinLink]} className="text-primary-600">
              Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.6,
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 180,
    height: 60,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skipPill: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  indicatorRow: {
    position: "absolute",
    left: 30,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  indicatorBar: {
    height: 8,
    borderRadius: 100,
  },
  contentCard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    marginTop: -20,
  },
  headline: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  ctaButton: {
    paddingHorizontal: 24,

  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    paddingBottom: 4,
  },
  signinText: {
    fontSize: 14,
  },
  signinLink: {
    fontSize: 13,
    fontWeight: "600",
  },
});