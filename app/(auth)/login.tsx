import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { auth, db } from "@/src/config/firebase";
import { useToast } from "@/src/context/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const resolveRole = async (uid: string, userEmail: string) => {
  const ownerByUid = await getDoc(doc(db, "users", uid));
  if (ownerByUid.exists()) return ownerByUid.data()?.role;

  const ownerByEmail = await getDocs(
    query(collection(db, "users"), where("email", "==", userEmail), limit(1)),
  );
  if (!ownerByEmail.empty) return ownerByEmail.docs[0].data()?.role;

  return null;
};

const LoginInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    rightElement,
    keyboardType = "default",
    secureTextEntry = false,
    mt = false,
  }: any) => (
    <View className={mt ? "mt-5" : ""}>
      <Text
        className="text-slate-700 mb-2 font-medium text-sm ml-1"
        style={{ fontFamily: "Poppins_500Medium" }}
      >
        {label}
      </Text>
      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-1 shadow-sm">
        <Ionicons name={icon} size={20} color="#6366f1" className="mr-3" />
        <TextInput
          className="flex-1 text-slate-900 text-base py-3 px-1"
          style={{ fontFamily: "Poppins_400Regular" }}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
        {rightElement}
      </View>
    </View>
  ),
);
LoginInput.displayName = "LoginInput";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleLogin = useCallback(async () => {
    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      showToast("Please enter your email", "error");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    if (!password) {
      showToast("Please enter your password", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
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
        showToast("Account profile not found", "error");
        return;
      }

      const isOwnerRole = actualRole === "owner" || actualRole === "admin";

      if (!isOwnerRole) {
        await signOut(auth);
        showToast("Only owner accounts are allowed", "error");
        return;
      }

      showToast("Welcome back!", "success");
      router.replace("/(owner)/(tabs)/dashboard");
    } catch (error: any) {
      let message = "Login failed. Please check your credentials.";
      if (error.code === "auth/user-not-found")
        message = "No account found with this email.";
      if (error.code === "auth/wrong-password") message = "Incorrect password.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [email, password, showToast, router]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-8"
        >
          <View className="flex-1 justify-center py-12">
            {/* Header Section */}
            <View className="items-center mb-12">
              <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-6 shadow-xl shadow-indigo-200">
                <Ionicons name="time" size={48} color="white" />
              </View>
              <Text
                className="text-4xl font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "Poppins_700Bold" }}
              >
                Attendance<Text className="text-indigo-600">Pro</Text>
              </Text>
              <Text
                className="text-slate-500 mt-2 text-center text-lg font-medium"
                style={{ fontFamily: "Poppins_500Medium" }}
              >
                Manage your workplace with precision
              </Text>
            </View>

            {/* Input Fields */}
            <View>
              <LoginInput
                label="Owner Email"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="name@company.com"
                icon="mail-outline"
                keyboardType="email-address"
              />

              <LoginInput
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                mt={true}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                }
              />

              {/* Action Button */}
              <TouchableOpacity
                className={`bg-indigo-600 py-5 rounded-2xl mt-10 items-center shadow-lg shadow-indigo-300 ${
                  loading ? "opacity-70" : "opacity-100"
                }`}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-white font-bold text-lg"
                    style={{ fontFamily: "Poppins_600SemiBold" }}
                  >
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
