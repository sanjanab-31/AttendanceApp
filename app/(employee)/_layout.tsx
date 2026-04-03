import { useAuth } from "@/src/context/AuthContext";
import { Redirect, Stack } from "expo-router";

/**
 * Employee Layout
 * Employee route group is intentionally disabled in owner-only mode.
 */
export default function EmployeeLayout() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;

  if (isAdmin) return <Redirect href="/(owner)/(tabs)/dashboard" />;

  return <Redirect href="/(auth)/login" />;
}
