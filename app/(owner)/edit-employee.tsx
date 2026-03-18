import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  maxLength?: number;
  iconName?: any;
  error?: string;
};

const InputField = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    maxLength,
    iconName,
    error,
  }: InputFieldProps) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    return (
      <View className="mb-4">
        <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
          {label}
        </Text>
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
            elevation: isFocused ? 2 : 0,
          }}
        >
          {iconName && (
            <View className="mr-3">
              <TabBarIcon
                name={iconName}
                color={isFocused ? "#4f46e5" : error ? "#fb7185" : "#94a3b8"}
                size={20}
              />
            </View>
          )}
          <TextInput
            className="flex-1 text-[15px] font-medium text-slate-800 h-full"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            keyboardType={keyboardType}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </View>
        {error ? (
          <Text className="text-rose-500 text-[12px] font-medium mt-1 ml-1">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - re-render only if these change
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.keyboardType === nextProps.keyboardType &&
      prevProps.maxLength === nextProps.maxLength &&
      prevProps.iconName === nextProps.iconName &&
      prevProps.error === nextProps.error &&
      prevProps.onChangeText === nextProps.onChangeText
    );
  },
);

const parseDateFromKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = parseDateFromKey(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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
  const [employeeConfigured, setEmployeeConfigured] = useState(false);

  // Memoized callbacks for each field to prevent unnecessary re-renders
  const handleNameChange = useCallback((text: string) => {
    setFormData((prev) => ({ ...prev, name: text }));
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    setFormData((prev) => ({
      ...prev,
      phone: text.replace(/[^\d]/g, "").slice(0, 10),
    }));
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setFormData((prev) => ({ ...prev, email: text }));
  }, []);

  const handleHourlyRateChange = useCallback((text: string) => {
    setFormData((prev) => ({ ...prev, hourlyRate: text }));
  }, []);

  const handleJoiningDateChange = useCallback((text: string) => {
    setFormData((prev) => ({ ...prev, joiningDate: text }));
  }, []);

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
      setEmployeeConfigured(true);
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
      showToast("Please fill all fields", "error");
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

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      showToast("Hourly rate must be a valid number greater than 0", "error");
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

      showToast("Member updated successfully!", "success");
      setConfirmVisible(false);
      router.back();
    } catch (error: any) {
      showToast(error?.message || "Unable to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#ffffff" }}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center px-6 py-4">
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
          <View className="ml-4">
            <Text className="text-xl font-extrabold text-slate-900">
              Edit Member
            </Text>
            <Text className="text-[13px] text-slate-500 font-medium mt-0.5">
              Update{" "}
              {employeeConfigured ? formData.name.split(" ")[0] : "staff"}'s
              details
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          className="px-6 pt-2"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {employeeConfigured ? (
            <View className="mb-6">
              <InputField
                label="Full Name"
                iconName="person"
                value={formData.name}
                onChangeText={handleNameChange}
                placeholder="John Doe"
              />
              <InputField
                label="Phone Number"
                iconName="call"
                value={formData.phone}
                onChangeText={handlePhoneChange}
                placeholder="1234567890"
                keyboardType="phone-pad"
                maxLength={10}
                error={
                  formData.phone.length > 0 && formData.phone.length !== 10
                    ? "Must be exactly 10 digits"
                    : undefined
                }
              />
              <InputField
                label="Email Address"
                iconName="mail"
                value={formData.email}
                onChangeText={handleEmailChange}
                placeholder="john@example.com"
                keyboardType="email-address"
              />

              <View className="flex-row justify-between mb-4">
                <View className="flex-1 mr-2">
                  <InputField
                    label="Hourly Rate (â‚¹)"
                    iconName="cash"
                    value={formData.hourlyRate}
                    onChangeText={handleHourlyRateChange}
                    placeholder="e.g. 500"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Joining Date
                  </Text>
                  <View className="flex-row items-center bg-slate-100 border border-slate-200 rounded-2xl px-4 h-14">
                    <TabBarIcon name="calendar" color="#94a3b8" size={20} />
                    <Text className="text-[14px] font-bold text-slate-500 ml-3">
                      {formatDateDisplay(formData.joiningDate)}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                className={`py-4 rounded-2xl items-center shadow-lg mt-4 mb-10 ${loading ? "bg-indigo-400" : "bg-indigo-600 shadow-indigo-200"}`}
                onPress={handleSave}
                disabled={loading}
              >
                <Text className="text-white font-extrabold text-[16px]">
                  {loading ? "Updating..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Text className="text-slate-500 font-medium">
                Loading details...
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Confirm Update"
        message={`Are you sure you want to update ${formData.name}'s details?`}
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
