import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { auth, db } from "@/src/config/firebase";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const SignupInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    mt = false,
    keyboardType = "default",
  }: any) => (
    <View style={{ marginTop: mt ? 20 : 0 }}>
      <Text
        style={{
          color: "#334155",
          marginBottom: 10,
          fontWeight: "600",
          fontSize: 14,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#e2e8f0",
          padding: 16,
          borderRadius: 16,
          color: "#0f172a",
          fontSize: 16,
          shadowColor: "#f1f5f9",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 2,
          elevation: 2,
        }}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={keyboardType === "email-address" ? "none" : undefined}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.keyboardType === nextProps.keyboardType &&
      prevProps.secureTextEntry === nextProps.secureTextEntry &&
      prevProps.mt === nextProps.mt
    );
  },
);

export default function OwnerSignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleSignup = useCallback(async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill name, email, and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const { uid } = userCredential.user;

      await setDoc(doc(db, "users", uid), {
        uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "owner",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Owner account created successfully");
      router.push("/(owner)/(tabs)/dashboard");
    } catch (error: any) {
      Alert.alert(
        "Signup Failed",
        error?.message || "Unable to create owner account",
      );
    } finally {
      setLoading(false);
    }
  }, [name, email, password, router]);

  return (
    <SafeAreaView style={{ backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#ffffff" }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 24 }}
        >
          <View
            style={{ flex: 1, justifyContent: "center", paddingVertical: 48 }}
          >
            {/* Header Section */}
            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  backgroundColor: "#4f46e5",
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  shadowColor: "#4f46e5",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  color: "#0f172a",
                  letterSpacing: -0.5,
                }}
              >
                Owner <Text style={{ color: "#4f46e5" }}>Signup</Text>
              </Text>
              <Text
                style={{
                  color: "#64748b",
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "500",
                }}
              >
                Create your administrative account
              </Text>
            </View>

            {/* Form Fields */}
            <View>
              <SignupInput
                label="Full Name"
                placeholder="Enter your name"
                value={name}
                onChangeText={handleNameChange}
              />

              <SignupInput
                label="Email Address"
                placeholder="owner@company.com"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                mt={true}
              />

              <SignupInput
                label="Password"
                placeholder="Min. 8 characters"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={true}
                mt={true}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: "#4f46e5",
                  padding: 20,
                  borderRadius: 16,
                  marginTop: 40,
                  alignItems: "center",
                  shadowColor: "#4f46e5",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: loading ? 0.7 : 1,
                }}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                  >
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 32, alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#64748b", fontWeight: "500" }}>
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={{ color: "#4f46e5", fontWeight: "bold" }}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* Footer */}
            <View
              style={{
                marginTop: "auto",
                paddingTop: 40,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Step 1 of 2: Profile Creation
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
