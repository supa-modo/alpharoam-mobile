import { StyleProp, StyleSheet, TextStyle } from "react-native";

export const FONT_KEYS = {
  regular: "GoogleSansFlex",
  medium: "GoogleSansFlex-Medium",
  semibold: "GoogleSansFlex-SemiBold",
  bold: "GoogleSansFlex-Bold",
  extraBold: "GoogleSansFlex-ExtraBold",
  black: "GoogleSansFlex-Black",
} as const;

export const APP_FONT_FAMILY = FONT_KEYS.regular;

export const GOOGLE_SANS_FLEX_24PT_REQUIRES = {
  [FONT_KEYS.regular]: require("../assets/fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Regular.ttf"),
  [FONT_KEYS.medium]: require("../assets/fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Medium.ttf"),
  [FONT_KEYS.semibold]: require("../assets/fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-SemiBold.ttf"),
  [FONT_KEYS.bold]: require("../assets/fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Bold.ttf"),
  [FONT_KEYS.extraBold]: require("../assets/fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-ExtraBold.ttf"),
  [FONT_KEYS.black]: require("../assets/fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Black.ttf"),
} as const;

function parseFontWeight(w: TextStyle["fontWeight"]): number {
  if (w == null) return 400;
  if (w === "normal") return 400;
  if (w === "bold") return 700;
  if (typeof w === "number") return w;
  const n = parseInt(String(w), 10);
  return Number.isNaN(n) ? 400 : n;
}

export function appFontFamilyForNumericWeight(weight: number): string {
  if (weight < 450) return FONT_KEYS.regular;
  if (weight < 550) return FONT_KEYS.medium;
  if (weight < 650) return FONT_KEYS.semibold;
  if (weight < 750) return FONT_KEYS.bold;
  if (weight < 850) return FONT_KEYS.extraBold;
  return FONT_KEYS.black;
}

export function appTextTypographyOverrides(
  style: StyleProp<TextStyle> | undefined | null
): TextStyle {
  if (style == null || style === false) {
    return { fontFamily: FONT_KEYS.regular, fontWeight: "400" };
  }
  const flat = StyleSheet.flatten(style) as TextStyle;
  const n = parseFontWeight(flat.fontWeight);
  return {
    fontFamily: appFontFamilyForNumericWeight(n),
    fontWeight: "400",
  };
}

export function appFontFamilyForSvgFontWeight(fontWeight: string | undefined): string {
  const n = parseFontWeight(fontWeight as TextStyle["fontWeight"]);
  return appFontFamilyForNumericWeight(n);
}
