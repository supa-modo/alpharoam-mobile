import React from "react";
import { StyleSheet, View } from "react-native";
import { AuthenticatedStatusBarOverlay } from "./AuthenticatedStatusBarOverlay";

type AuthenticatedScreenWrapperProps = {
  children: React.ReactNode;
};

export function AuthenticatedScreenWrapper({ children }: AuthenticatedScreenWrapperProps) {
  return (
    <View style={styles.container}>
      {children}
      <AuthenticatedStatusBarOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
