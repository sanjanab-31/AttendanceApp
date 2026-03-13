import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    useFonts,
} from "@expo-google-fonts/poppins";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { DataProvider } from "../src/context/DataContext";

import "./global.css";

function RootLayoutNav() {
  console.log("--- RootLayout Loading ---");
  const { user, userData, loading, isAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (loading || !rootNavigationState?.key || segments.length === 0) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOwnerGroup = segments[0] === "(owner)";
    const inEmployeeGroup = segments[0] === "(employee)";
    const currentPath = `/${segments.join("/")}`;

    const role = userData?.role;

    let targetPath: string | null = null;

    if (!user && !inAuthGroup) {
      targetPath = "/(auth)/login";
    }

    if (user) {
      // If profile has not been mapped to a role, keep user in auth flow.
      if (!role) {
        targetPath = "/(auth)/login";
      } else if (inAuthGroup) {
        // Redirect away from auth to the correct dashboard.
        targetPath = isAdmin
          ? "/(owner)/(tabs)/dashboard"
          : "/(employee)/(tabs)/dashboard";
      } else if (isAdmin && !inOwnerGroup) {
        // Guard route groups by role so owner can never stay in employee portal.
        targetPath = "/(owner)/(tabs)/dashboard";
      } else if (!isAdmin && !inEmployeeGroup) {
        // Guard route groups by role so employee can never stay in owner portal.
        targetPath = "/(employee)/(tabs)/dashboard";
      }
    }

    if (!targetPath || currentPath === targetPath) {
      return;
    }

    const timeoutId = setTimeout(() => {
      router.replace(targetPath as any);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user, userData, loading, segments, isAdmin, rootNavigationState?.key, router]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(owner)" options={{ headerShown: false }} />
      <Stack.Screen name="(employee)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const textComponent: any = Text;
    const inputComponent: any = TextInput;

    textComponent.defaultProps = textComponent.defaultProps || {};
    inputComponent.defaultProps = inputComponent.defaultProps || {};

    textComponent.defaultProps.style = [
      textComponent.defaultProps.style,
      { fontFamily: "Poppins_400Regular" },
    ];
    inputComponent.defaultProps.style = [
      inputComponent.defaultProps.style,
      { fontFamily: "Poppins_400Regular" },
    ];
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}
