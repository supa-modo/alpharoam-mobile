import React from "react";
import { Redirect } from "expo-router";

/** Plan details open as a bottom sheet from the country screen. */
export default function PlanDetailRedirect() {
  return <Redirect href="/(app)/plans" />;
}
