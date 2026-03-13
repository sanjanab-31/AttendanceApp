import { firebaseConfig } from "@/src/config/firebase";
import { useData } from "@/src/context/DataContext";
import { useRouter } from "expo-router";
import { deleteApp, initializeApp } from "firebase/app";
import {
    createUserWithEmailAndPassword,
    getAuth,
    signOut,
} from "firebase/auth";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  secureTextEntry?: boolean;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
}: InputFieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-600 mb-2 font-medium">{label}</Text>
      <TextInput
        className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-800 shadow-sm"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

export default function AddEmployee() {
  const { addEmployee, employees } = useData();
  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const getInitialFormData = () => ({
    name: "",
    phone: "",
    email: "",
    password: "",
    hourlyRate: "",
    joiningDate: new Date().toISOString().split("T")[0],
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const [loading, setLoading] = useState(false);

  const generateUniqueEmployeeId = () => {
    // EMP + yymmdd + random(3) keeps IDs short and highly unique.
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
  };

  const handleSave = async () => {
    const { name, phone, email, password, hourlyRate, joiningDate } = formData;
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
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!phoneRegex.test(trimmedPhone)) {
      Alert.alert("Invalid Phone", "Phone number must be exactly 10 digits.");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      Alert.alert(
        "Invalid Rate",
        "Hourly rate must be a valid number greater than 0.",
      );
      return;
    }

    if (
      !dateRegex.test(joiningDate) ||
      Number.isNaN(new Date(joiningDate).getTime())
    ) {
      Alert.alert("Invalid Date", "Joining date must be in YYYY-MM-DD format.");
      return;
    }

    const duplicateEmail = employees.some(
      (emp: any) => (emp.email || "").toLowerCase() === normalizedEmail,
    );
    if (duplicateEmail) {
      Alert.alert("Duplicate Email", "This employee email already exists.");
      return;
    }

    setLoading(true);
    let tempApp: any = null;
    try {
      // Use secondary auth instance so owner remains logged in.
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

      // Add to Firestore employees collection
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

      // Keep owner on this screen so multiple employees can be added quickly.
      setFormData(getInitialFormData());
      Alert.alert(
        "Success",
        "Employee added successfully. You can add another employee.",
      );
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/email-already-in-use") {
        Alert.alert(
          "Email In Use",
          "This email is already registered in Firebase Auth.",
        );
      } else if (code === "auth/invalid-email") {
        Alert.alert("Invalid Email", "Please enter a valid employee email.");
      } else if (code === "auth/weak-password") {
        Alert.alert("Weak Password", "Password must be at least 6 characters.");
      } else {
        Alert.alert(
          "Error",
          error?.message || "Unable to create employee account.",
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
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="px-6 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <InputField
            label="Full Name"
            value={formData.name}
            onChangeText={(text: string) =>
              setFormData((prev) => ({ ...prev, name: text }))
            }
            placeholder="John Doe"
          />
          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text: string) =>
              setFormData((prev) => ({
                ...prev,
                phone: text.replace(/[^\d]/g, "").slice(0, 10),
              }))
            }
            placeholder="1234567890"
            keyboardType="phone-pad"
          />
          <InputField
            label="Email Address"
            value={formData.email}
            onChangeText={(text: string) =>
              setFormData((prev) => ({ ...prev, email: text }))
            }
            placeholder="john@example.com"
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            value={formData.password}
            onChangeText={(text: string) =>
              setFormData((prev) => ({ ...prev, password: text }))
            }
            placeholder="Set password"
            secureTextEntry
          />
          <InputField
            label="Hourly Rate (₹)"
            value={formData.hourlyRate}
            onChangeText={(text: string) =>
              setFormData((prev) => ({ ...prev, hourlyRate: text }))
            }
            placeholder="500"
            keyboardType="numeric"
          />
          <InputField
            label="Joining Date"
            value={formData.joiningDate}
            onChangeText={(text: string) =>
              setFormData((prev) => ({ ...prev, joiningDate: text }))
            }
            placeholder="YYYY-MM-DD"
          />

          <TouchableOpacity
            className={`bg-blue-600 p-4 rounded-2xl mt-4 mb-10 items-center ${loading ? "opacity-70" : ""}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">
              {loading ? "Adding..." : "Save & Add Another"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 p-4 rounded-2xl -mt-6 mb-10 items-center"
            onPress={() => router.push("/(owner)/(tabs)/employees")}
            disabled={loading}
          >
            <Text className="text-gray-700 font-bold text-lg">
              View Employee List
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
