import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  maxLength?: number;
  iconName?: any;
  error?: string;
  autoFocus?: boolean;
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
    autoFocus,
  }: InputFieldProps) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            isFocused ? styles.inputWrapperFocused : null,
            error ? styles.inputWrapperError : null,
          ]}
        >
          {iconName && (
            <View style={styles.inputIconContainer}>
              <TabBarIcon
                name={iconName}
                color={isFocused ? "#4f46e5" : error ? "#fb7185" : "#94a3b8"}
                size={20}
              />
            </View>
          )}
          <TextInput
            style={styles.inputText}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            keyboardType={keyboardType}
            maxLength={maxLength}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={autoFocus}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

const parseDateFromKey = (dateValue: any) => {
  if (!dateValue) return new Date();
  if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
  
  const dateStr = String(dateValue);
  const [year, month, day] = dateStr.split("-").map(Number);
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
  const lastLoadedId = useRef<string | null>(null);

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

  useEffect(() => {
    if (lastLoadedId.current === id && employeeConfigured) return;

    const employee = employees.find((e: any) => e.id === id);
    if (employee) {
      setFormData({
        name: employee.name || "",
        phone: employee.phone || "",
        email: employee.email || "",
        hourlyRate: employee.hourlyRate ? employee.hourlyRate.toString() : "",
        joiningDate: employee.joiningDate || "",
      });
      lastLoadedId.current = String(id);
      setEmployeeConfigured(true);
    }
  }, [id, employees, employeeConfigured]);

  const handleSave = async () => {
    const { name, phone, email, hourlyRate, joiningDate } = formData;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const parsedRate = parseFloat(hourlyRate);

    if (!trimmedName || !trimmedPhone || !normalizedEmail || !hourlyRate || !joiningDate) {
      showToast("Please fill all fields", "error");
      return;
    }

    if (!phoneRegex.test(trimmedPhone)) {
      showToast("Phone number must be 10 digits", "error");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      showToast("Please enter a valid email", "error");
      return;
    }

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      showToast("Invalid hourly rate", "error");
      return;
    }

    setConfirmVisible(true);
  };

  const confirmUpdate = async () => {
    const { name, phone, email, hourlyRate, joiningDate } = formData;
    setLoading(true);
    try {
      await updateEmployee(id as string, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        hourlyRate: parseFloat(hourlyRate),
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

  const content = (
    <>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Edit Member</Text>
          <Text style={styles.headerSubtitle}>
            Update {employeeConfigured ? formData.name.split(" ")[0] : "staff"}'s details
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {employeeConfigured ? (
          <View style={styles.formContainer}>
            <InputField
              label="Full Name"
              iconName="person"
              value={formData.name}
              onChangeText={handleNameChange}
              placeholder="John Doe"
              autoFocus={true}
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

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Hourly Rate (₹)"
                  iconName="cash"
                  value={formData.hourlyRate}
                  onChangeText={handleHourlyRateChange}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Joining Date</Text>
                <View style={styles.dateDisplay}>
                  <TabBarIcon name="calendar" color="#94a3b8" size={20} />
                  <Text style={styles.dateDisplayText}>
                    {formatDateDisplay(formData.joiningDate)}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading ? styles.saveButtonLoading : null]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Updating..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex1}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex1}>{content}</View>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="Confirm Update"
        message={`Are you sure you want to update ${formData.name}'s details?`}
        confirmText="Update"
        variant="update"
        loading={loading}
        onCancel={() => {
          if (!loading) setConfirmVisible(false);
        }}
        onConfirm={confirmUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerText: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formContainer: {
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  inputWrapperFocused: {
    borderColor: "#4f46e5",
    backgroundColor: "#ffffff",
  },
  inputWrapperError: {
    borderColor: "#fb7185",
    backgroundColor: "#fff1f2",
  },
  inputIconContainer: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    height: "100%",
  },
  errorText: {
    color: "#f43f5e",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonLoading: {
    backgroundColor: "#a5b4fc",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "500",
  },
});
