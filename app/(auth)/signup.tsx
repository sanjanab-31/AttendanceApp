import { auth, db } from "@/src/config/firebase";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { StatusBar } from "expo-status-bar";

const SignupInput = ({ label, value, onChangeText, placeholder, secureTextEntry, mt, keyboardType }: any) => (
  <View className={mt ? "mt-5" : ""}>
    <Text className="text-slate-700 mb-2.5 font-semibold text-[14px] ml-1">{label}</Text>
    <TextInput
      className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-900 text-[16px] shadow-sm shadow-slate-100"
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize={keyboardType === "email-address" ? "none" : undefined}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

export default function OwnerSignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
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
  };

  return (
    <SafeAreaView>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          <View className="flex-1 justify-center py-12">
            {/* Header Section */}
            <View className="items-center mb-10">
              <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-6 shadow-xl shadow-indigo-200">
                <Text className="text-4xl">ðŸ‘¤</Text>
              </View>
              <Text className="text-4xl font-bold text-slate-900 tracking-tight">
                Owner <Text className="text-indigo-600">Signup</Text>
              </Text>
              <Text className="text-slate-500 mt-2 text-center text-lg font-medium">
                Create your administrative account
              </Text>
            </View>

            {/* Form Fields */}
            <View>
              <SignupInput
                label="Full Name"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
              />

              <SignupInput
                label="Email Address"
                placeholder="owner@company.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                mt
              />

              <SignupInput
                label="Password"
                placeholder="Min. 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mt
              />

              <TouchableOpacity
                className={`bg-indigo-600 p-5 rounded-2xl mt-10 items-center shadow-lg shadow-indigo-200 ${
                  loading ? "opacity-70" : ""
                }`}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="mt-8 items-center">
              <View className="flex-row items-center">
                <Text className="text-slate-500 font-medium">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-indigo-600 font-bold">Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* Footer */}
            <View className="mt-auto pt-10 items-center">
              <Text className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
                Step 1 of 2: Profile Creation
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


