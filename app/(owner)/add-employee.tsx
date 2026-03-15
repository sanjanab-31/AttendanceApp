import { firebaseConfig } from "@/src/config/firebase";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import DateTimePicker from "@react-native-community/datetimepicker";
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
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { StatusBar } from "expo-status-bar";

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  secureTextEntry?: boolean;
  maxLength?: number;
  iconName?: any;
  error?: string;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  maxLength,
  iconName,
  error,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{label}</Text>
      <View 
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          height: 56,
          borderColor: isFocused ? "#4f46e5" : error ? "#fb7185" : "#e2e8f0",
          backgroundColor: error ? "#fff1f2" : "white",
          elevation: isFocused ? 2 : 0
        }}
      >
        {iconName && (
           <View className="mr-3">
             <TabBarIcon name={iconName} color={isFocused ? "#4f46e5" : error ? "#fb7185" : "#94a3b8"} size={20} />
           </View>
        )}
        <TextInput
          className="flex-1 text-[15px] font-medium text-slate-800 h-full"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error ? (
        <Text className="text-rose-500 text-[12px] font-medium mt-1 ml-1">{error}</Text>
      ) : null}
    </View>
  );
}

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
      year: "numeric"
   });
};

export default function AddEmployee() {
  const { addEmployee, employees } = useData();
  const router = useRouter();
  const { showToast } = useToast();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const getInitialFormData = () => ({
    name: "",
    phone: "",
    email: "",
    password: "",
    hourlyRate: "",
    joiningDate: toDateKey(new Date()),
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);

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
      showToast("Staff member added successfully!", "success");
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/email-already-in-use") {
        showToast(
          "This email is already registered.",
          "error",
        );
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
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
         <View className="flex-row items-center px-6 py-4">
            <TouchableOpacity 
               onPress={() => router.back()}
               style={{ width: 40, height: 40, backgroundColor: "white", borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e8f0", elevation: 1 }}
            >
               <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
            </TouchableOpacity>
            <View className="ml-4">
               <Text className="text-xl font-extrabold text-slate-900">New Member</Text>
               <Text className="text-[13px] text-slate-500 font-medium mt-0.5">Add a new staff to the roster</Text>
            </View>
         </View>

        <ScrollView
          style={{ flex: 1 }}
          className="px-6 pt-2"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6">
             <InputField
               label="Full Name"
               iconName="person"
               value={formData.name}
               onChangeText={(text: string) =>
                 setFormData((prev) => ({ ...prev, name: text }))
               }
               placeholder="e.g. John Doe"
             />
             <InputField
               label="Phone Number"
               iconName="call"
               value={formData.phone}
               onChangeText={(text: string) =>
                 setFormData((prev) => ({
                   ...prev,
                   phone: text.replace(/[^\d]/g, "").slice(0, 10),
                 }))
               }
               placeholder="10-digit mobile number"
               keyboardType="phone-pad"
               maxLength={10}
               error={formData.phone.length > 0 && formData.phone.length !== 10 ? "Must be exactly 10 digits" : undefined}
             />
             <InputField
               label="Email Address"
               iconName="mail"
               value={formData.email}
               onChangeText={(text: string) =>
                 setFormData((prev) => ({ ...prev, email: text }))
               }
               placeholder="john@example.com"
               keyboardType="email-address"
             />
             <InputField
               label="Temporary Password"
               iconName="lock-closed"
               value={formData.password}
               onChangeText={(text: string) =>
                 setFormData((prev) => ({ ...prev, password: text }))
               }
               placeholder="At least 6 characters"
               secureTextEntry
             />

             <View className="flex-row justify-between mb-4">
               <View className="flex-1 mr-2">
                 <InputField
                   label="Hourly Rate (â‚¹)"
                   iconName="cash"
                   value={formData.hourlyRate}
                   onChangeText={(text: string) =>
                     setFormData((prev) => ({ ...prev, hourlyRate: text }))
                   }
                   placeholder="e.g. 150"
                   keyboardType="numeric"
                 />
               </View>
               <View className="flex-1 ml-2">
                 <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Joining Date</Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 16, paddingHorizontal: 16, height: 56 }}
                    onPress={() => setShowJoiningDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <TabBarIcon name="calendar" color="#94a3b8" size={20} />
                    <Text className="text-[14px] font-bold text-slate-800 ml-3">{formatDateDisplay(formData.joiningDate)}</Text>
                  </TouchableOpacity>
               </View>
             </View>
          </View>

          {showJoiningDatePicker ? (
            <DateTimePicker
              value={parseDateFromKey(formData.joiningDate)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowJoiningDatePicker(false);
                }

                if (!selectedDate) return;

                setFormData((prev) => ({
                  ...prev,
                  joiningDate: toDateKey(selectedDate),
                }));
              }}
            />
          ) : null}

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center shadow-lg mb-4 ${loading ? "bg-indigo-400" : "bg-indigo-600 shadow-indigo-200"}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-extrabold text-[16px]">
              {loading ? "Adding Member..." : "Save & Add Another"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-2xl items-center bg-white border border-slate-200 mb-10"
            onPress={() => router.push("/(owner)/(tabs)/employees")}
            disabled={loading}
          >
            <Text className="text-slate-700 font-bold text-[15px]">
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

