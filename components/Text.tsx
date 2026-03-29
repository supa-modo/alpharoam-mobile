import React from "react";
import { Platform, Text as RNText, TextProps } from "react-native";
import { appTextTypographyOverrides } from "../constants/typography";

const androidTextMetrics =
  Platform.OS === "android" ? ({ includeFontPadding: false } as const) : null;

export function Text(props: TextProps & { allowFontScaling?: boolean }) {
  const { style, allowFontScaling, ...rest } = props;
  const typography = appTextTypographyOverrides(style);
  return (
    <RNText
      allowFontScaling={allowFontScaling ?? false}
      style={[style, androidTextMetrics, typography]}
      {...rest}
    />
  );
}
