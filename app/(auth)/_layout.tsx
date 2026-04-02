import { useAuth } from "@/src/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Auth Layout
 * Always returns a Stack to keep navigation context stable.
 */
export default function AuthLayout() {
  const { user, userData, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user || !userData?.role) return;

    if (!isAdmin) {
      logout().catch(() => {
        /* ignore */
      });
      router.replace("/(auth)/login");
      return;
    }

    router.replace("/(owner)/(tabs)/dashboard");
  }, [loading, user, userData, isAdmin, logout, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
