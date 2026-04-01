// ─── app/(app)/_layout.tsx ───────────────────────────────────────────────────
import { Tabs } from "expo-router";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { Text } from "../../components/Text";
import { AuthBoundary } from "../../components/AuthBoundary";
import React, { useEffect } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";

const TABS = [
  { name: "index", label: "Home", icon: "home-outline", iconActive: "home" },
  { name: "plans", label: "Plans", icon: "globe-outline", iconActive: "globe" },
  { name: "profile", label: "Profile", icon: "person-outline", iconActive: "person" },
];

const VISIBLE_TAB_NAMES = ["index", "plans", "profile"] as const;

const ACTIVE_COLOR = "#0064e6";
const DURATION = 180;
const EASING = Easing.out(Easing.quad);

function TabItem({
  route, isFocused, onPress, onLongPress, isDark,
}: {
  route: any; isFocused: boolean;
  onPress: () => void; onLongPress: () => void; isDark: boolean;
}) {
  const tab = TABS.find((t) => t.name === route.name);
  if (!tab) return null;
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [isFocused]);

  const pillAnim = useAnimatedStyle(() => ({
    opacity: progress.value * (isDark ? 0.18 : 0.1),
  }));

  const inactiveColor = isDark ? "rgba(100,116,139,0.75)" : "rgba(100,116,139,0.9)";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      android_ripple={{ color: "rgba(59,130,246,0.08)", borderless: true }}
    >
      {/* Pill highlight */}
      <Animated.View style={[styles.pill, pillAnim, { backgroundColor: ACTIVE_COLOR }]} />

      {/* Icon */}
      <Ionicons
        name={(isFocused ? tab.iconActive : tab.icon) as any}
        size={20}
        color={isFocused ? ACTIVE_COLOR : inactiveColor}
      />

      {/* Label */}
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? ACTIVE_COLOR : inactiveColor },
          isFocused && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  // BlurView uses hardware bitmaps on Android and breaks under software rendering; iOS only.
  const iosBlurIntensity = isDark ? 30 : 38;

  const activeRouteName = state.routes[state.index]?.name ?? "";
  if (!VISIBLE_TAB_NAMES.includes(activeRouteName as any)) {
    return null;
  }

  const routesToShow = state.routes.filter((route) =>
    VISIBLE_TAB_NAMES.includes(route.name as (typeof VISIBLE_TAB_NAMES)[number])
  );

  return (
    <View
      style={[styles.outer, { bottom: Math.max(insets.bottom, 8) + 8 }]}
      pointerEvents="box-none"

    >
      <View
        style={[
          styles.bar,
          isDark ? styles.barDark : styles.barLight,
          Platform.OS === "android" && (isDark ? styles.barDarkAndroid : styles.barLightAndroid),
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={iosBlurIntensity}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        {routesToShow.map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          if (options.tabBarButton === null) return null;

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              isDark={isDark}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

export default function AppLayout() {
  return (
    <AuthBoundary>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="plans" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </AuthBoundary>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  bar: {


    flexDirection: "row",
    height: 66,
    borderRadius: 26,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 18 },
      android: { elevation: 16 },
    }),
  },
  barDark: {
    backgroundColor: "rgba(8,18,32,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  barLight: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.09)",
  },
  /** Stronger fill on Android (no BlurView) for a glass-like bar without hardware bitmaps */
  barDarkAndroid: {
    backgroundColor: "rgba(8,18,32,0.96)",
  },
  barLightAndroid: {
    backgroundColor: "rgba(255,255,255,0.97)",
  },

  // Three tabs share width equally (flex: 1 each)
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 10,
    position: "relative",
  },

  // Pill sits flush behind the content
  pill: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 8,
    marginVertical: 7,
    borderRadius: 16,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.15,
    textAlign: "center",
  },
  tabLabelActive: {
    fontWeight: "700",
    fontSize: 10.5,
  },
});
