import { useAuth } from "@/src/context/AuthContext";
import { Redirect } from "expo-router";

/**
 * Employee Layout
 * Employee route group is intentionally disabled in owner-only mode.
 */
export default function EmployeeLayout() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Redirect href={isAdmin ? "/(owner)/(tabs)/dashboard" : "/(auth)/login"} />
  );
}
