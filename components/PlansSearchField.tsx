import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";

import { TextInput } from "./TextInput";

type PlansSearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function PlansSearchField({ value, onChangeText, placeholder }: PlansSearchFieldProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        isDark ? styles.fieldDark : styles.fieldLight,
        focused && (isDark ? styles.focusedDark : styles.focusedLight),
      ]}
    >
      <Ionicons
        name="search"
        size={18}
        color={
          focused
            ? "#2563EB"
            : isDark
              ? "rgba(148,163,184,0.75)"
              : "rgba(100,116,139,0.7)"
        }
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.55)"}
        style={[styles.input, isDark && styles.inputDark]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={12} style={styles.clearBtn}>
          <View style={isDark ? styles.clearInnerDark : styles.clearInnerLight}>
            <Ionicons
              name="close"
              size={12}
              color={isDark ? "rgba(148,163,184,0.95)" : "rgba(71,85,105,0.9)"}
            />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 22,
    marginBottom: 16,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  fieldLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#9ca3af",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldDark: {
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  focusedLight: {
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  focusedDark: {
    borderColor: "rgba(59,130,246,0.55)",
  },
  input: {
    flex: 1,
    height: 43,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  inputDark: { color: "#F8FAFC" },
  clearBtn: { padding: 2 },
  clearInnerLight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearInnerDark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(148,163,184,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
