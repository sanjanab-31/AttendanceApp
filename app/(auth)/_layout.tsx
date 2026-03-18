import { useAuth } from "@/src/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Auth Layout
 * Always returns a Stack to keep navigation context stable.
 */
export default function AuthLayout() {
  const { user, userData, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Delay slightly to ensure tree stability on Fabric
    const timer = setTimeout(() => {
      if (loading) return;

      if (user && userData?.role) {
        router.replace(
          isAdmin ? "/(owner)/(tabs)/dashboard" : "/(employee)/(tabs)/dashboard"
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, userData, loading, isAdmin]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

