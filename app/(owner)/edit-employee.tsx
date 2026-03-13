import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  maxLength?: number;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
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
        maxLength={maxLength}
      />
    </View>
  );
}

export default function EditEmployee() {
  const { employees, updateEmployee } = useData();
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams();
  const phoneRegex = /^\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    hourlyRate: "",
    joiningDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    const employee = employees.find((e: any) => e.id === id);
    if (employee) {
      setFormData({
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        hourlyRate: employee.hourlyRate.toString(),
        joiningDate: employee.joiningDate,
      });
    }
  }, [id, employees]);

  const handleSave = async () => {
    const { name, phone, email, hourlyRate, joiningDate } = formData;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const parsedRate = parseFloat(hourlyRate);

    if (
      !trimmedName ||
      !trimmedPhone ||
      !normalizedEmail ||
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

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      Alert.alert(
        "Invalid Rate",
        "Hourly rate must be a valid number greater than 0.",
      );
      return;
    }

    setConfirmVisible(true);
  };

  const confirmUpdate = async () => {
    const { name, phone, email, hourlyRate, joiningDate } = formData;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const parsedRate = parseFloat(hourlyRate);

    setLoading(true);
    try {
      await updateEmployee(id as string, {
        name: trimmedName,
        phone: trimmedPhone,
        email: normalizedEmail,
        hourlyRate: parsedRate,
        joiningDate,
      });

      showToast("Employee updated successfully!", "success");
      setConfirmVisible(false);
      router.back();
    } catch (error: any) {
      showToast(error?.message || "Unable to update employee.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
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
            maxLength={10}
          />
          {formData.phone.length > 0 && formData.phone.length !== 10 ? (
            <Text className="text-red-500 text-xs -mt-2 mb-3">
              Phone number must be exactly 10 digits.
            </Text>
          ) : null}
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
              {loading ? "Saving..." : "Update Details"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Confirm Update"
        message="Are you sure you want to update the employee details?"
        confirmText="Update"
        variant="update"
        loading={loading}
        onCancel={() => {
          if (!loading) {
            setConfirmVisible(false);
          }
        }}
        onConfirm={confirmUpdate}
      />
    </SafeAreaView>
  );
}
