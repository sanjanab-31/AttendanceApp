import { useAuth } from "@/src/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Employee Layout
 * Always returns a Stack to keep navigation context stable.
 */
export default function EmployeeLayout() {
  const { user, loading, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) return;

      const isEmployee = userData?.role === "employee";
      if (!user || !isEmployee) {
        router.replace("/(auth)/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, userData, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
