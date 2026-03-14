import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, userData, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Delay slightly to ensure navigation context is fully mounted on Fabric
    const timer = setTimeout(() => {
      if (loading) return;

      if (!user || !userData?.role) {
        router.replace("/(auth)/login");
      } else if (isAdmin) {
        router.replace("/(owner)/(tabs)/dashboard");
      } else {
        router.replace("/(employee)/(tabs)/dashboard");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, userData, loading, isAdmin]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
      }}
    >
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}
