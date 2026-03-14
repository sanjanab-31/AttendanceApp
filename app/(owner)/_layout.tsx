import { useAuth } from "@/src/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Owner Layout
 * Always returns a Stack to keep navigation context stable.
 */
export default function OwnerLayout() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) return;

      if (!user || !isAdmin) {
        router.replace("/(auth)/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, isAdmin, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="mark-attendance"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="add-employee"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="edit-employee"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="bonus-management"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
