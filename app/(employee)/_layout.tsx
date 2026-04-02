import { Stack } from "expo-router";

/**
 * Employee Layout
 * Always returns a Stack to keep navigation context stable.
 */
export default function EmployeeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
