import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { auth, db } from "@/src/config/firebase";
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
    Alert,
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

const RoleSwitcher = React.memo(
  ({
    selectedRole,
    onSelect,
  }: {
    selectedRole: string;
    onSelect: (role: "owner" | "employee") => void;
  }) => (
    <View
      style={{
        backgroundColor: "rgba(226, 232, 240, 0.5)",
        borderRadius: 16,
        padding: 6,
        flexDirection: "row",
        marginBottom: 32,
      }}
    >
      <TouchableOpacity
        onPress={() => onSelect("owner")}
        activeOpacity={0.7}
        style={{
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor: selectedRole === "owner" ? "white" : "transparent",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: selectedRole === "owner" ? 0.05 : 0,
          shadowRadius: 2,
          elevation: selectedRole === "owner" ? 2 : 0,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 15,
            color: selectedRole === "owner" ? "#4f46e5" : "#64748b",
          }}
        >
          Owner
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onSelect("employee")}
        activeOpacity={0.7}
        style={{
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor:
            selectedRole === "employee" ? "white" : "transparent",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: selectedRole === "employee" ? 0.05 : 0,
          shadowRadius: 2,
          elevation: selectedRole === "employee" ? 2 : 0,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 15,
            color: selectedRole === "employee" ? "#4f46e5" : "#64748b",
          }}
        >
          Employee
        </Text>
      </TouchableOpacity>
    </View>
  ),
);

const LoginInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    secureTextEntry = false,
    mt = false,
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
        autoCapitalize="none"
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

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<"owner" | "employee">(
    "owner",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSelectRole = useCallback((role: "owner" | "employee") => {
    setSelectedRole(role);
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleLogin = useCallback(async () => {
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
  }, [selectedRole, email, password, router]);

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
            <View style={{ alignItems: "center", marginBottom: 48 }}>
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
                <Text style={{ fontSize: 40, color: "white" }}>🕒</Text>
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  color: "#0f172a",
                  letterSpacing: -0.5,
                }}
              >
                Attendance<Text style={{ color: "#4f46e5" }}>Pro</Text>
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
                Manage your workplace with precision
              </Text>
            </View>

            <RoleSwitcher
              selectedRole={selectedRole}
              onSelect={handleSelectRole}
            />

            {/* Input Fields */}
            <View>
              <LoginInput
                label={
                  selectedRole === "owner" ? "Owner Email" : "Employee Email"
                }
                value={email}
                onChangeText={handleEmailChange}
                placeholder="name@company.com"
                keyboardType="email-address"
              />

              <LoginInput
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                secureTextEntry={true}
                mt={true}
              />

              {/* Action Buttons */}
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
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                  >
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {selectedRole === "owner" ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 24,
                  }}
                >
                  <Text style={{ color: "#64748b", fontWeight: "500" }}>
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/signup")}
                  >
                    <Text style={{ color: "#4f46e5", fontWeight: "bold" }}>
                      Create one
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={{
                    marginTop: 32,
                    alignItems: "center",
                    backgroundColor: "#fffbeb",
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#fef3c7",
                  }}
                >
                  <Text
                    style={{
                      color: "#92400e",
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    Employee accounts are managed by your employer. Contact your
                    owner for access credentials.
                  </Text>
                </View>
              )}
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
                Powered by AttendancePro v1.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
