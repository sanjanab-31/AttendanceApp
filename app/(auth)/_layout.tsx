import { useAuth } from "@/src/context/AuthContext";
import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

/**
 * Auth Layout
 * Always returns a Stack to keep navigation context stable.
 */
export default function AuthLayout() {
  const { user, userData, loading, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!loading && user && userData?.role && !isAdmin) {
      logout().catch(() => {
        /* ignore */
      });
    }
  }, [loading, user, userData, isAdmin, logout]);

  if (loading || !user || !userData?.role) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(owner)/(tabs)/dashboard" />;
}
