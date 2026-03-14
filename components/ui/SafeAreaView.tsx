import React from "react";
import { View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Edge = "top" | "right" | "bottom" | "left";

type SafeAreaViewProps = ViewProps & {
  edges?: Edge[];
};

export function SafeAreaView({ edges = ["top"], style, ...rest }: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  const insetStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
  };

  return <View style={[{ flex: 1 }, insetStyle, style]} {...rest} />;
}
