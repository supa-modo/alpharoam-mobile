import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";

export function AuthenticatedStatusBarOverlay() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const overlayHeight = insets.top + 5;

  return (
    <View pointerEvents="none" style={[styles.container, { height: overlayHeight }]}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(2,6,23,0.72)", "rgba(2,6,23,0.5)", "rgba(2,6,23,0)"]
            : ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 25,
  },
});
