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
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { DataProvider } from "../src/context/DataContext";
import { ToastProvider } from "../src/context/ToastContext";

import "./global.css";

function RootLayoutNav() {
  console.log("--- RootLayout Loading ---");
  const { user, userData, loading, isAdmin } = useAuth();

  if (loading) {
    return null;
  }

  const hasRole = Boolean(userData?.role);

  if (!user || !hasRole) {
    return (
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name={isAdmin ? "(owner)" : "(employee)"}
        options={{ headerShown: false }}
      />
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
          <ToastProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ToastProvider>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}
