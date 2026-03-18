import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { firebaseConfig } from "@/src/config/firebase";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import React, { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateFromKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const formatDateDisplay = (dateStr: string) => {
  const date = parseDateFromKey(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AddEmployee() {
  const { addEmployee, employees } = useData();
  const router = useRouter();
  const { showToast } = useToast();

  // Form state - ONE state per field to avoid re-renders causing focus loss
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [joiningDate, setJoiningDate] = useState(toDateKey(new Date()));
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const hourlyRateInputRef = useRef<TextInput>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const phoneError =
    phone.length > 0 && phone.length !== 10 ? "Must be exactly 10 digits" : "";

  const resetForm = useCallback(() => {
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setHourlyRate("");
    setJoiningDate(toDateKey(new Date()));
  }, []);

  const generateUniqueEmployeeId = useCallback(() => {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    let employeeId = "";
    do {
      const random = Math.floor(100 + Math.random() * 900);
      employeeId = `EMP${y}${m}${d}${random}`;
    } while (employees.some((emp: any) => emp.employeeId === employeeId));

    return employeeId;
  }, [employees]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const parsedRate = parseFloat(hourlyRate);

    if (
      !trimmedName ||
      !trimmedPhone ||
      !normalizedEmail ||
      !password ||
      !hourlyRate ||
      !joiningDate
    ) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (!phoneRegex.test(trimmedPhone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      showToast("Hourly rate must be a valid number greater than 0", "error");
      return;
    }

    if (
      !dateRegex.test(joiningDate) ||
      Number.isNaN(new Date(joiningDate).getTime())
    ) {
      showToast("Invalid joining date", "error");
      return;
    }

    const duplicateEmail = employees.some(
      (emp: any) => (emp.email || "").toLowerCase() === normalizedEmail,
    );
    if (duplicateEmail) {
      showToast("This employee email already exists", "error");
      return;
    }

    setLoading(true);
    let tempApp: any = null;
    try {
      tempApp = initializeApp(
        firebaseConfig,
        `employee-create-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      );
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        normalizedEmail,
        password,
      );
      const uid = userCredential.user.uid;
      const employeeId = generateUniqueEmployeeId();

      await addEmployee({
        uid,
        employeeId,
        name: trimmedName,
        phone: trimmedPhone,
        email: normalizedEmail,
        hourlyRate: parsedRate,
        joiningDate,
        role: "employee",
      });

      resetForm();
      showToast("Staff member added successfully!", "success");
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/email-already-in-use") {
        showToast("This email is already registered.", "error");
      } else if (code === "auth/invalid-email") {
        showToast("Please enter a valid employee email.", "error");
      } else if (code === "auth/weak-password") {
        showToast("Password must be at least 6 characters.", "error");
      } else {
        showToast(
          error?.message || "Unable to create employee account.",
          "error",
        );
      }
    } finally {
      if (tempApp) {
        try {
          await signOut(getAuth(tempApp));
        } catch {}
        try {
          await deleteApp(tempApp);
        } catch {}
      }
      setLoading(false);
    }
  }, [
    name,
    phone,
    email,
    password,
    hourlyRate,
    joiningDate,
    employees,
    showToast,
    generateUniqueEmployeeId,
    addEmployee,
    resetForm,
  ]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#ffffff" }}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: "white",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#e2e8f0",
              elevation: 1,
            }}
          >
            <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
              New Member
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#64748b",
                fontWeight: "500",
                marginTop: 4,
              }}
            >
              Add a new staff to the roster
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Field */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#334155",
                marginBottom: 8,
                marginLeft: 4,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Full Name
            </Text>
            <Pressable
              onPress={() => nameInputRef.current?.focus()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                borderColor: "#e2e8f0",
                backgroundColor: "white",
                elevation: 0,
              }}
            >
              <TabBarIcon name="person" color="#94a3b8" size={20} />
              <TextInput
                ref={nameInputRef}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0f172a",
                  height: "100%",
                }}
                value={name}
                onChangeText={setName}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94a3b8"
                showSoftInputOnFocus
              />
            </Pressable>
          </View>

          {/* Phone Field */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#334155",
                marginBottom: 8,
                marginLeft: 4,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Phone Number
            </Text>
            <Pressable
              onPress={() => phoneInputRef.current?.focus()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                borderColor:
                  phoneError
                    ? "#fb7185"
                    : "#e2e8f0",
                backgroundColor: phoneError ? "#fff1f2" : "white",
                elevation: 0,
              }}
            >
              <TabBarIcon
                name="call"
                color={
                  phoneError
                    ? "#fb7185"
                    : "#94a3b8"
                }
                size={20}
              />
              <TextInput
                ref={phoneInputRef}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0f172a",
                  height: "100%",
                }}
                value={phone}
                onChangeText={(text) =>
                  setPhone(text.replace(/[^\d]/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                showSoftInputOnFocus
              />
            </Pressable>
            {phoneError ? (
              <Text
                style={{
                  fontSize: 12,
                  color: "#fb7185",
                  fontWeight: "500",
                  marginTop: 4,
                  marginLeft: 4,
                }}
              >
                {phoneError}
              </Text>
            ) : null}
          </View>

          {/* Email Field */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#334155",
                marginBottom: 8,
                marginLeft: 4,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Email Address
            </Text>
            <Pressable
              onPress={() => emailInputRef.current?.focus()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                borderColor: "#e2e8f0",
                backgroundColor: "white",
                elevation: 0,
              }}
            >
              <TabBarIcon name="mail" color="#94a3b8" size={20} />
              <TextInput
                ref={emailInputRef}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0f172a",
                  height: "100%",
                }}
                value={email}
                onChangeText={setEmail}
                placeholder="john@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                showSoftInputOnFocus
              />
            </Pressable>
          </View>

          {/* Password Field */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#334155",
                marginBottom: 8,
                marginLeft: 4,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Temporary Password
            </Text>
            <Pressable
              onPress={() => passwordInputRef.current?.focus()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                borderColor: "#e2e8f0",
                backgroundColor: "white",
                elevation: 0,
              }}
            >
              <TabBarIcon name="lock-closed" color="#94a3b8" size={20} />
              <TextInput
                ref={passwordInputRef}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0f172a",
                  height: "100%",
                }}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                showSoftInputOnFocus
              />
            </Pressable>
          </View>

          {/* Hourly Rate & Date Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            {/* Hourly Rate */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#334155",
                  marginBottom: 8,
                  marginLeft: 4,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Hourly Rate (₹)
              </Text>
              <Pressable
                onPress={() => hourlyRateInputRef.current?.focus()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  height: 56,
                  borderColor: "#e2e8f0",
                  backgroundColor: "white",
                  elevation: 0,
                }}
              >
                <TabBarIcon name="cash" color="#94a3b8" size={20} />
                <TextInput
                  ref={hourlyRateInputRef}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#0f172a",
                    height: "100%",
                  }}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="e.g. 150"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  showSoftInputOnFocus
                />
              </Pressable>
            </View>

            {/* Joining Date */}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#334155",
                  marginBottom: 8,
                  marginLeft: 4,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Joining Date
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  height: 56,
                  backgroundColor: "white",
                }}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <TabBarIcon name="calendar" color="#94a3b8" size={20} />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#0f172a",
                  }}
                >
                  {formatDateDisplay(joiningDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={parseDateFromKey(joiningDate)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowDatePicker(false);
                }
                if (selectedDate) {
                  setJoiningDate(toDateKey(selectedDate));
                }
              }}
            />
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 12,
              backgroundColor: loading ? "#a78bfa" : "#4f46e5",
              elevation: 4,
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              {loading ? "Adding Member..." : "Save & Add Another"}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#e2e8f0",
              backgroundColor: "white",
            }}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={{ color: "#475569", fontWeight: "700", fontSize: 15 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
