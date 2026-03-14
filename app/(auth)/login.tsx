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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { StatusBar } from "expo-status-bar";

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

const RoleSwitcher = ({ selectedRole, onSelect }: { selectedRole: string; onSelect: (role: "owner" | "employee") => void }) => (
  <View className="bg-slate-200/50 rounded-2xl p-1.5 flex-row mb-8">
    <TouchableOpacity
      onPress={() => onSelect("owner")}
      className={`flex-1 py-3.5 rounded-xl items-center ${
        selectedRole === "owner" ? "bg-white shadow-sm" : ""
      }`}
    >
      <Text
        className={`font-bold text-[15px] ${
          selectedRole === "owner" ? "text-indigo-600" : "text-slate-500"
        }`}
      >
        Owner
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => onSelect("employee")}
      className={`flex-1 py-3.5 rounded-xl items-center ${
        selectedRole === "employee" ? "bg-white shadow-sm" : ""
      }`}
    >
      <Text
        className={`font-bold text-[15px] ${
          selectedRole === "employee" ? "text-indigo-600" : "text-slate-500"
        }`}
      >
        Employee
      </Text>
    </TouchableOpacity>
  </View>
);

const LoginInput = ({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, mt }: any) => (
  <View className={mt ? "mt-5" : ""}>
    <Text className="text-slate-700 mb-2.5 font-semibold text-[14px] ml-1">
      {label}
    </Text>
    <TextInput
      className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-900 text-[16px] shadow-sm shadow-slate-100"
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<"owner" | "employee">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      const isOwnerRole = actualRole === "owner" || actualRole === "admin";

      if (selectedRole === "owner" && !isOwnerRole) {
        await signOut(auth);
        Alert.alert("Login Error", "This account is not an owner account.");
        return;
      }

      if (selectedRole === "employee" && actualRole !== "employee") {
        await signOut(auth);
        Alert.alert("Login Error", "This account is not an employee account.");
        return;
      }

      router.replace(
        isOwnerRole
          ? "/(owner)/(tabs)/dashboard"
          : "/(employee)/(tabs)/dashboard",
      );
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
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
            <View className="items-center mb-12">
              <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-6 shadow-xl shadow-indigo-200">
                <Text className="text-4xl text-white">ðŸ•’</Text>
              </View>
              <Text
                className="text-4xl font-bold text-slate-900 tracking-tight"
              >
                Attendance<Text className="text-indigo-600">Pro</Text>
              </Text>
              <Text className="text-slate-500 mt-2 text-center text-lg font-medium">
                Manage your workplace with precision
              </Text>
            </View>

            <RoleSwitcher selectedRole={selectedRole} onSelect={setSelectedRole} />

            {/* Input Fields */}
            <View>
              <LoginInput
                label={selectedRole === "owner" ? "Owner Email" : "Employee Email"}
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                keyboardType="email-address"
              />

              <LoginInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                mt
              />

              {/* Action Buttons */}
              <TouchableOpacity
                className={`bg-indigo-600 p-5 rounded-2xl mt-10 items-center shadow-lg shadow-indigo-200 ${
                  loading ? "opacity-70" : ""
                }`}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {selectedRole === "owner" ? (
                <View className="flex-row items-center justify-center mt-6">
                  <Text className="text-slate-500 font-medium">Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                    <Text className="text-indigo-600 font-bold">Create one</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mt-8 items-center bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <Text className="text-amber-800 text-center text-sm font-medium">
                    Employee accounts are managed by your employer. Contact your owner for access credentials.
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View className="mt-auto pt-10 items-center">
              <Text className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
                Powered by AttendancePro v1.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
