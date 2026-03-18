import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Theme color helper for light and dark modes.
 */

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
