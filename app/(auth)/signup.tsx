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
} from "react-native";

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-8 py-12">
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">👤</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800">
              Owner Signup
            </Text>
            <Text className="text-gray-500 mt-2">
              Create your admin account
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-600 mb-2 font-medium">Name</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800"
                placeholder="Owner Name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mt-4">
              <Text className="text-gray-600 mb-2 font-medium">
                Email Address
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800"
                placeholder="owner@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="mt-4">
              <Text className="text-gray-600 mb-2 font-medium">Password</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`bg-blue-600 p-4 rounded-xl mt-8 items-center ${loading ? "opacity-70" : ""}`}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? "Creating..." : "Create Owner Account"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 items-center">
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
