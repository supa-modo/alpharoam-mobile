import React from "react";
import { TextInput as RNTextInput, TextInputProps } from "react-native";
import { appTextTypographyOverrides } from "../constants/typography";

export function TextInput(props: TextInputProps) {
  const { style, ...rest } = props;
  const typography = appTextTypographyOverrides(style);
  return (
    <RNTextInput
      allowFontScaling={false}
      style={[style, typography]}
      {...rest}
    />
  );
}
