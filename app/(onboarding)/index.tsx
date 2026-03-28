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

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Roam Smarter\nAcross 190+\nCountries",
    tag: "GLOBAL COVERAGE",
    description:
      "Activate eSIM data plans before you land and stay connected worldwide — no roaming fees, no surprises.",
    image: require("../../assets/images/hero1.png"),
    accent: "#6C63FF",
    accentSoft: "#6C63FF22",
  },
  {
    title: "Flexible Plans\nThat Fit\nYour Journey",
    tag: "SMART PRICING",
    description:
      "Choose daily, weekly, or monthly packs with transparent pricing and real-time usage tracking.",
    image: require("../../assets/images/hero3.png"),
    accent: "#00C9A7",
    accentSoft: "#00C9A722",
  },
  {
    title: "Instant Setup\nNo Physical\nSIMs Needed",
    tag: "ZERO HASSLE",
    description:
      "Install your eSIM in minutes directly from the app and keep your main number fully active.",
    image: require("../../assets/images/hero1.png"),
    accent: "#FF6B6B",
    accentSoft: "#FF6B6B22",
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
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentSlide = SLIDES[page];

  const animateToPage = (nextPage: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
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

  const bg = isDark ? "#0A0A0F" : "#F8F7FF";
  const cardBg = isDark ? "#13131A" : "#FFFFFF";
  const textPrimary = isDark ? "#FAFAFA" : "#0D0D1A";
  const textSecondary = isDark ? "#8888AA" : "#7070A0";
  const borderColor = isDark ? "#222230" : "#E8E7F0";

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
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          style={StyleSheet.absoluteFill}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={{ width, height: height * 0.62 }}>
              <Image
                source={slide.image}
                style={{ width, height: height * 0.62 }}
                resizeMode="cover"
              />
              {/* Gradient overlay */}
              <LinearGradient
                colors={isDark
                  ? ["transparent", "rgba(10,10,15,0.3)", bg]
                  : ["transparent", "rgba(248,247,255,0.25)", bg]
                }
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              {/* Top gradient for status bar */}
              <LinearGradient
                colors={isDark
                  ? [bg, "transparent"]
                  : [bg, "transparent"]
                }
                locations={[0, 1]}
                style={[StyleSheet.absoluteFill, { height: 120, bottom: undefined }]}
              />
            </View>
          ))}
        </ScrollView>

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.logoRow}>
            <Image
              source={require("../../assets/icon2.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.topBarRight}>
            <Pressable onPress={handleSkip} style={[styles.skipPill, { borderColor }]}>
              <Text style={[styles.skipText, { color: textSecondary }]}>Skip</Text>
            </Pressable>
            <ThemeToggle />
          </View>
        </View>

        {/* Slide indicators (top right area, thin lines) */}
        <View style={[styles.indicatorRow, { top: insets.top + 14 }]}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicatorBar,
                {
                  backgroundColor: i === page
                    ? currentSlide.accent
                    : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"),
                  width: i === page ? 24 : 6,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content card */}
      <View style={[styles.contentCard, { backgroundColor: bg }]}>

        {/* Tag chip */}
        <Animated.View
          style={[
            styles.tagChip,
            {
              backgroundColor: currentSlide.accentSoft,
              borderColor: currentSlide.accent + "44",
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.tagDot, { backgroundColor: currentSlide.accent }]} />
          <Text style={[styles.tagText, { color: currentSlide.accent }]}>
            {currentSlide.tag}
          </Text>
        </Animated.View>

        {/* Headline */}
        <Animated.Text
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
        </Animated.Text>

        {/* Description */}
        <Animated.Text
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
        </Animated.Text>

        {/* CTA Button */}
        <View style={{ marginTop: 24, paddingBottom: insets.bottom + 16 }}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: currentSlide.accent,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...Platform.select({
                  ios: {
                    shadowColor: currentSlide.accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.45,
                    shadowRadius: 16,
                  },
                  android: { elevation: 10 },
                }),
              },
            ]}
          >
            <Text style={styles.ctaText}>Get Started</Text>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={16} color={currentSlide.accent} />
            </View>
          </Pressable>

          {/* Sign in link */}
          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.signinRow}>
            <Text style={[styles.signinText, { color: textSecondary }]}>
              Already have an account?{" "}
            </Text>
            <Text style={[styles.signinLink, { color: currentSlide.accent }]}>
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
    height: height * 0.62,
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
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
  },
  logo: {
    width: 140,
    height: 44,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skipPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
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
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  indicatorBar: {
    height: 4,
    borderRadius: 2,
  },
  contentCard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    marginTop: -20,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    gap: 10,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
    marginTop: 16,
    paddingBottom: 4,
  },
  signinText: {
    fontSize: 14,
  },
  signinLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});