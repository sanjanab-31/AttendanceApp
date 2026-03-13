import { auth, db } from "@/src/config/firebase";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    where,
} from "firebase/firestore";
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

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<"owner" | "employee">(
    "owner",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const resolveRole = async (uid: string, userEmail: string) => {
    const ownerByUid = await getDoc(doc(db, "users", uid));
    if (ownerByUid.exists()) return ownerByUid.data()?.role;

    const ownerByEmail = await getDocs(
      query(collection(db, "users"), where("email", "==", userEmail), limit(1)),
    );
    if (!ownerByEmail.empty) return ownerByEmail.docs[0].data()?.role;

    const empByUid = await getDocs(
      query(collection(db, "employees"), where("uid", "==", uid), limit(1)),
    );
    if (!empByUid.empty) return empByUid.docs[0].data()?.role;

    const empByEmail = await getDocs(
      query(
        collection(db, "employees"),
        where("email", "==", userEmail),
        limit(1),
      ),
    );
    if (!empByEmail.empty) return empByEmail.docs[0].data()?.role;

    return null;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );

      const actualRole = await resolveRole(
        userCredential.user.uid,
        userCredential.user.email?.toLowerCase() || email.trim().toLowerCase(),
      );

      if (!actualRole) {
        await signOut(auth);
        Alert.alert(
          "Access Denied",
          "Your account profile was not found. Please contact the owner.",
        );
        return;
      }

      if (
        selectedRole === "owner" &&
        actualRole !== "owner" &&
        actualRole !== "admin"
      ) {
        await signOut(auth);
        Alert.alert("Login Error", "This account is not an owner account.");
        return;
      }

      if (selectedRole === "employee" && actualRole !== "employee") {
        await signOut(auth);
        Alert.alert("Login Error", "This account is not an employee account.");
        return;
      }

      // Navigation is handled by the RootLayout effect on auth change
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
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
              <Text className="text-4xl">🕒</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800">
              AttendancePro
            </Text>
            <Text className="text-gray-500 mt-2">
              Manage your workplace efficiently
            </Text>
          </View>

          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg items-center ${selectedRole === "owner" ? "bg-blue-600" : "bg-transparent"}`}
              onPress={() => setSelectedRole("owner")}
            >
              <Text
                className={`font-semibold ${selectedRole === "owner" ? "text-white" : "text-gray-600"}`}
              >
                Owner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg items-center ${selectedRole === "employee" ? "bg-green-600" : "bg-transparent"}`}
              onPress={() => setSelectedRole("employee")}
            >
              <Text
                className={`font-semibold ${selectedRole === "employee" ? "text-white" : "text-gray-600"}`}
              >
                Employee
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-600 mb-2 font-medium">
                {selectedRole === "owner" ? "Owner Email" : "Employee Email"}
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800"
                placeholder="email@example.com"
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
              className={`${selectedRole === "owner" ? "bg-blue-600" : "bg-green-600"} p-4 rounded-xl mt-8 items-center ${loading ? "opacity-70" : ""}`}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-white font-bold text-lg">
                {loading
                  ? "Logging in..."
                  : selectedRole === "owner"
                    ? "Login as Owner"
                    : "Login as Employee"}
              </Text>
            </TouchableOpacity>

            {selectedRole === "owner" ? (
              <TouchableOpacity
                className="border border-blue-600 p-4 rounded-xl mt-3 items-center"
                onPress={() => router.push("/(auth)/signup")}
              >
                <Text className="text-blue-600 font-bold text-base">
                  Create Owner Account
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="mt-10 items-center">
            <Text className="text-gray-400 text-sm">Design by Antigravity</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
