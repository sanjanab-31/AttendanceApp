import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

// Consolidate warning suppression at the very top
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release.",
  "@firebase/auth: Auth",
  "@firebase/firestore: Firestore",
  "You are initializing Firebase Auth for React Native without providing AsyncStorage.",
  "[Reanimated] Reading from `value` during component render.",
  "[Reanimated] Writing to `value` during component render.",
]);

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
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "../src/context/AuthContext";
import { DataProvider } from "../src/context/DataContext";
import { ToastProvider } from "../src/context/ToastContext";

import "./global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

function RootLayoutNav() {
  return (
    <Stack initialRouteName="(auth)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(owner)" options={{ headerShown: false }} />
      <Stack.Screen name="(employee)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <DataProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <ToastProvider>
                {/* 
                  Stable content tree for New Architecture.
                */}
                {fontsLoaded || fontError ? (
                  <RootLayoutNav />
                ) : (
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
                )}
                <StatusBar style="auto" />
              </ToastProvider>
            </ThemeProvider>
          </DataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
