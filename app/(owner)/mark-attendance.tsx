import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { calculateSalaryBreakdown, formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getDateKey = (value: any) => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "Select Date";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "Invalid Date";
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDateTimeValue = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};



export default function MarkAttendance() {
  const { employees, attendance, markAttendance } = useData();
  const { showToast } = useToast();
  const router = useRouter();

  const getEmployeeRowId = (employee: any, index?: number) => {
    const base = employee?.id || employee?.employeeId || employee?.uid || employee?.email;
    return base ? String(base) : `missing-id-${index}`;
  };

  const getEmployeeDisplayName = (employee: any) => {
    return (typeof employee?.name === "string" && employee.name.trim()) ? employee.name : "Unnamed";
  };

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [date, setDate] = useState(getDateKey(new Date()));
  const [shiftHours, setShiftHours] = useState("8");
  const [otHours, setOtHours] = useState("0");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmUpdateVisible, setConfirmUpdateVisible] = useState(false);

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const selectedEmployee = safeEmployees.find((e: any, index: number) => {
    return getEmployeeRowId(e, index) === selectedEmployeeId;
  });

  const resolvedEmployeeId = selectedEmployee?.employeeId || selectedEmployee?.id || "";

  const existingAttendanceRecord = selectedEmployee
    ? safeAttendance.find((record: any) => {
        if (record.employeeId !== resolvedEmployeeId) return false;
        const recordDate = record.date?.toDate?.() || record.date;
        return getDateKey(record.dateKey || recordDate) === getDateKey(date);
      })
    : undefined;

  const isUpdateMode = Boolean(existingAttendanceRecord);

  const lastLoadedKey = React.useRef("");

  useEffect(() => {
    const currentKey = `${selectedEmployeeId}-${date}`;
    if (lastLoadedKey.current === currentKey) return;

    if (existingAttendanceRecord) {
      setShiftHours(String(existingAttendanceRecord.shiftHours ?? "8"));
      setOtHours(String(existingAttendanceRecord.otHours ?? "0"));
      lastLoadedKey.current = currentKey;
      return;
    }

    setShiftHours("8");
    setOtHours("0");
    lastLoadedKey.current = currentKey;
  }, [selectedEmployeeId, date, existingAttendanceRecord?.id]);

  const salaryPreview = selectedEmployee
    ? calculateSalaryBreakdown(
        parseFloat(shiftHours || "0"),
        parseFloat(otHours || "0"),
        parseFloat(selectedEmployee.hourlyRate || "0")
      )
    : null;

  const initiateSave = () => {
    if (!selectedEmployeeId || !date || !shiftHours) {
      showToast("Please select employee, date and shift hours", "error");
      return;
    }

    if (isUpdateMode) {
      setConfirmUpdateVisible(true);
      return;
    }

    executeSave();
  };

  const executeSave = async () => {
    if (!selectedEmployee) {
      showToast("Please select an employee.", "error"); return;
    }
    if (!resolvedEmployeeId) {
      showToast("Selected employee is missing an Employee ID.", "error"); return;
    }

    setLoading(true);
    try {
      if (!salaryPreview) return;

      const result = await markAttendance({
        employeeId: resolvedEmployeeId,
        employeeName: selectedEmployee.name,
        date: date,
        shiftHours: parseFloat(shiftHours),
        otHours: parseFloat(otHours || "0"),
        remarks: "",
        shiftSalary: salaryPreview.shiftSalary,
        otSalary: salaryPreview.otSalary,
        totalSalary: salaryPreview.totalSalary,
      });

      showToast(
        result === "updated" ? "Attendance updated successfully" : "Attendance marked successfully",
        "success"
      );
      router.back();
    } catch (error: any) {
      showToast(error?.message || "Unable to save attendance.", "error");
    } finally {
      if (confirmUpdateVisible) setConfirmUpdateVisible(false);
      setLoading(false);
    }
  };

  const content = (
    <>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <Text style={styles.headerSubtitle}>Record daily shifts and hours</Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.sectionSpacing}>
            <Text style={styles.sectionLabel}>Select Staff Member</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
              {safeEmployees.map((emp: any, index: number) => {
                const rowId = getEmployeeRowId(emp, index);
                const active = selectedEmployeeId === rowId;
                return (
                  <TouchableOpacity
                    key={rowId}
                    onPress={() => setSelectedEmployeeId(rowId)}
                    style={[
                      styles.employeeTab,
                      active ? styles.employeeTabActive : styles.employeeTabInactive
                    ]}
                  >
                    <Text style={active ? styles.employeeTextActive : styles.employeeTextInactive}>
                      {getEmployeeDisplayName(emp)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dateAndShiftRow}>
            <View style={styles.halfWidthLeft}>
              <Text style={styles.sectionLabel}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <TabBarIcon name="calendar" color="#4f46e5" size={20} />
                <Text style={styles.datePickerText}>{formatDateDisplay(date)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.halfWidthRight}>
              <Text style={styles.sectionLabel}>Shift Hours</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputText}
                  value={shiftHours}
                  onChangeText={setShiftHours}
                  placeholder="e.g. 8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {isUpdateMode ? (
            <View style={styles.updateWarningContainer}>
              <TabBarIcon name="information-circle" color="#d97706" size={20} />
              <View style={styles.updateWarningTextContainer}>
                <Text style={styles.updateWarningTitle}>Existing record found</Text>
                <Text style={styles.updateWarningBody}>
                  Saving will update the shift hours and OT hours for {formatDateDisplay(date)}.
                </Text>
              </View>
            </View>
          ) : null}

          {/* OT Hours - Focus Fixed */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Overtime (OT) Hours</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <TabBarIcon name="time" color="#94a3b8" size={20} />
              </View>
              <TextInput
                style={styles.inputText}
                value={otHours}
                onChangeText={setOtHours}
                placeholder="e.g. 2"
                keyboardType="numeric"
              />
            </View>
          </View>



          {salaryPreview && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Earnings Preview</Text>

              <View style={styles.previewRow}>
                <View style={styles.previewRowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                    <TabBarIcon name="briefcase" color="#059669" size={16} />
                  </View>
                  <Text style={styles.previewItemName}>Shift Salary</Text>
                </View>
                <Text style={styles.previewAmount}>{formatCurrency(salaryPreview.shiftSalary)}</Text>
              </View>

              <View style={styles.previewRow}>
                <View style={styles.previewRowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#fffbeb' }]}>
                    <TabBarIcon name="time" color="#d97706" size={16} />
                  </View>
                  <Text style={styles.previewItemName}>OT Salary</Text>
                </View>
                <Text style={styles.previewAmount}>{formatCurrency(salaryPreview.otSalary)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payout</Text>
                <Text style={styles.totalAmount}>{formatCurrency(salaryPreview.totalSalary)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, loading ? styles.saveButtonLoading : null]}
            onPress={initiateSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : isUpdateMode ? "Update Attendance" : "Save Attendance"}
            </Text>
          </TouchableOpacity>
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

      {showDatePicker ? (
        <DateTimePicker
          value={getDateTimeValue(date)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, selectedDate) => {
            if (Platform.OS === "android") setShowDatePicker(false);
            if (!selectedDate) return;
            setDate(getDateKey(selectedDate));
          }}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmUpdateVisible}
        title="Confirm Update"
        message={`Are you sure you want to update ${selectedEmployee?.name}'s attendance for ${formatDateDisplay(date)}?`}
        confirmText="Update"
        variant="update"
        loading={loading}
        onCancel={() => {
          if (!loading) setConfirmUpdateVisible(false);
        }}
        onConfirm={executeSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  flex1: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, backgroundColor: "white", borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e8f0", elevation: 1 },
  headerTextContainer: { marginLeft: 16 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  headerSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "500", marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  sectionSpacing: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  row: { flexDirection: "row" },
  
  employeeTab: { marginRight: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  employeeTabActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', elevation: 4, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  employeeTabInactive: { backgroundColor: 'white', borderColor: '#e2e8f0' },
  employeeTextActive: { fontWeight: '700', fontSize: 14, color: 'white' },
  employeeTextInactive: { fontWeight: '700', fontSize: 14, color: '#334155' },

  dateAndShiftRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  halfWidthLeft: { flex: 1, marginRight: 8 },
  halfWidthRight: { flex: 1, marginLeft: 8 },
  
  datePickerButton: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 16, paddingHorizontal: 16, height: 56 },
  datePickerText: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginLeft: 12 },
  
  hoursContainer: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: 4, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  hoursTab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  hoursTabActive: { backgroundColor: "white", borderColor: "#e2e8f0", elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  hoursTabInactive: { borderColor: "transparent", backgroundColor: "transparent" },
  hoursTextActive: { fontWeight: "700", fontSize: 14, color: "#4f46e5" },
  hoursTextInactive: { fontWeight: "700", fontSize: 14, color: "#64748b" },

  updateWarningContainer: { marginBottom: 24, borderRadius: 16, borderWidth: 1, borderColor: "#fde68a", backgroundColor: "#fffbeb", padding: 16, flexDirection: "row", alignItems: "flex-start" },
  updateWarningTextContainer: { flex: 1, marginLeft: 12 },
  updateWarningTitle: { fontWeight: "700", color: "#78350f", fontSize: 14, marginBottom: 4 },
  updateWarningBody: { color: "#b45309", fontSize: 13, lineHeight: 20 },

  previewCard: { backgroundColor: "white", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, marginBottom: 32, marginTop: 8 },
  previewLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  previewRowLeft: { flexDirection: "row", alignItems: "center" },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  previewItemName: { color: "#475569", fontWeight: "500" },
  previewAmount: { color: "#0f172a", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#eef2ff", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e0e7ff" },
  totalLabel: { color: "#3730a3", fontWeight: "700", flex: 1 },
  totalAmount: { color: "#4338ca", fontWeight: "900", fontSize: 20 },

  saveButton: { paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: "#4f46e5", elevation: 4, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, marginBottom: 40 },
  saveButtonLoading: { backgroundColor: "#818cf8" },
  saveButtonText: { color: "white", fontWeight: "800", fontSize: 16 },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, borderColor: "#e2e8f0" },
  inputWrapperFocused: { borderColor: "#4f46e5", elevation: 2, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  inputIcon: { marginRight: 12 },
  inputText: { flex: 1, fontSize: 15, fontWeight: "500", color: "#0f172a" }
});
