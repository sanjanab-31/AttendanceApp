import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { calculateSalaryBreakdown, formatCurrency } from "@/src/utils/salary";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { StatusBar } from "expo-status-bar";

const getDateKey = (value: any) => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string) => {
   if (!dateStr) return "N/A";
   const [year, month, day] = dateStr.split("-").map(Number);
   const date = new Date(year, month - 1, day);
   return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
   });
};

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  iconName?: any;
  multiline?: boolean;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  iconName,
  multiline = false,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{label}</Text>
      <View 
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "white",
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          minHeight: multiline ? 100 : 56,
          paddingVertical: multiline ? 12 : 0,
          borderColor: isFocused ? "#4f46e5" : "#e2e8f0",
          elevation: isFocused ? 2 : 0
        }}
      >
        {iconName && !multiline && (
           <View className="mr-3">
             <TabBarIcon name={iconName} color={isFocused ? "#4f46e5" : "#94a3b8"} size={20} />
           </View>
        )}
        <TextInput
          className={`flex-1 text-[15px] font-medium text-slate-800 ${multiline ? "" : "h-full"}`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    </View>
  );
}

export default function MarkAttendance() {
  const { employees, attendance, markAttendance } = useData();
  const { showToast } = useToast();
  const router = useRouter();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [date, setDate] = useState(getDateKey(new Date()));
  const [shiftHours, setShiftHours] = useState("8");
  const [otHours, setOtHours] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmUpdateVisible, setConfirmUpdateVisible] = useState(false);

  const selectedEmployee = employees.find(
    (e: any) => e.id === selectedEmployeeId,
  );
  const existingAttendanceRecord = selectedEmployee
    ? attendance.find((record: any) => {
        if (record.employeeId !== selectedEmployee.employeeId) {
          return false;
        }

        const recordDate = record.date?.toDate?.() || record.date;
        return getDateKey(record.dateKey || recordDate) === getDateKey(date);
      })
    : undefined;
  const isUpdateMode = Boolean(existingAttendanceRecord);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setShiftHours("8");
      setOtHours("0");
      setRemarks("");
      return;
    }

    if (existingAttendanceRecord) {
      setShiftHours(String(existingAttendanceRecord.shiftHours ?? "8"));
      setOtHours(String(existingAttendanceRecord.otHours ?? "0"));
      setRemarks(existingAttendanceRecord.remarks || "");
      return;
    }

    setShiftHours("8");
    setOtHours("0");
    setRemarks("");
  }, [selectedEmployeeId, date, existingAttendanceRecord]);

  const salaryPreview = selectedEmployee
    ? calculateSalaryBreakdown(
        parseFloat(shiftHours || "0"),
        parseFloat(otHours || "0"),
        selectedEmployee.hourlyRate,
      )
    : null;

  const handleSave = async () => {
    if (!selectedEmployeeId || !date || !shiftHours) {
      showToast("Please select employee, date and shift hours", "error");
      return;
    }

    if (isUpdateMode) {
      setConfirmUpdateVisible(true);
      return;
    }

    await saveAttendance();
  };

  const saveAttendance = async () => {
    if (!selectedEmployee) {
      showToast("Please select an employee.", "error");
      return;
    }

    setLoading(true);
    try {
      if (!salaryPreview) return;

      const result = await markAttendance({
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        date: date,
        shiftHours: parseFloat(shiftHours),
        otHours: parseFloat(otHours || "0"),
        remarks,
        shiftSalary: salaryPreview.shiftSalary,
        otSalary: salaryPreview.otSalary,
        totalSalary: salaryPreview.totalSalary,
      });

      showToast(
        result === "updated"
          ? "Attendance updated successfully"
          : "Attendance marked successfully",
        "success",
      );
      router.back();
    } catch (error: any) {
      showToast(error?.message || "Unable to save attendance.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]}>
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
               <Text className="text-xl font-extrabold text-slate-900">Mark Attendance</Text>
               <Text className="text-[13px] text-slate-500 font-medium mt-0.5">Record daily shifts and hours</Text>
            </View>
         </View>

        <ScrollView 
          style={{ flex: 1 }}
          className="px-6 pt-2" 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6">
             <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Select Staff Member</Text>
             <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               className="flex-row"
             >
               {employees.map((emp: any) => {
                 const active = selectedEmployeeId === emp.id;
                 return (
                   <TouchableOpacity
                     key={emp.id}
                     onPress={() => setSelectedEmployeeId(emp.id)}
                     className={`mr-2.5 px-5 py-3 rounded-2xl border ${
                       active ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100" : "bg-white border-slate-200"
                     }`}
                   >
                     <Text className={`font-bold text-[14px] ${active ? "text-white" : "text-slate-700"}`}>
                       {emp.name}
                     </Text>
                   </TouchableOpacity>
                 );
               })}
             </ScrollView>
          </View>

          <View className="flex-row justify-between mb-6">
            <View className="flex-1 mr-2">
               <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Date</Text>
               <TouchableOpacity
                 className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14"
                 onPress={() => setShowDatePicker(true)}
                 activeOpacity={0.8}
               >
                 <TabBarIcon name="calendar" color="#4f46e5" size={20} />
                 <Text className="text-[14px] font-bold text-slate-800 ml-3">{formatDateDisplay(date)}</Text>
               </TouchableOpacity>
            </View>
            <View className="flex-1 ml-2">
               <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Shift Hours</Text>
               <View className="flex-row justify-between bg-slate-100 p-1 rounded-2xl border border-slate-200">
                 {["5", "6", "7", "8"].map((h) => {
                   const active = shiftHours === h;
                   return (
                     <TouchableOpacity
                       key={h}
                       onPress={() => setShiftHours(h)}
                       className={`flex-1 py-2.5 rounded-xl items-center ${active ? "bg-white shadow-sm border border-slate-200" : "border border-transparent"}`}
                     >
                       <Text className={`font-bold text-[14px] ${active ? "text-indigo-600" : "text-slate-500"}`}>
                         {h}h
                       </Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>
            </View>
          </View>

          {isUpdateMode ? (
            <View className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex-row items-start">
              <TabBarIcon name="information-circle" color="#d97706" size={20} />
              <View className="flex-1 ml-3">
                 <Text className="font-bold text-amber-900 text-[14px] mb-1">
                   Existing record found
                 </Text>
                 <Text className="text-amber-700 text-[13px] leading-5">
                   Saving will update the shift hours, OT hours, and remarks for {formatDateDisplay(date)}.
                 </Text>
              </View>
            </View>
          ) : null}

          <InputField
            label="Overtime (OT) Hours"
            iconName="time"
            value={otHours}
            onChangeText={setOtHours}
            placeholder="e.g. 2"
            keyboardType="numeric"
          />

          <InputField
            label="Remarks & Notes"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any special notes for this shift?"
            multiline
          />

          {salaryPreview && (
            <View style={{ backgroundColor: "white", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 32, marginTop: 8 }}>
              <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Earnings Preview</Text>
              
              <View className="flex-row justify-between items-center py-2">
                 <View className="flex-row items-center">
                    <View className="bg-emerald-50 w-8 h-8 rounded-full items-center justify-center mr-3">
                       <TabBarIcon name="briefcase" color="#059669" size={16} />
                    </View>
                    <Text className="text-slate-600 font-medium">Shift Salary</Text>
                 </View>
                 <Text className="text-slate-900 font-bold">{formatCurrency(salaryPreview.shiftSalary)}</Text>
              </View>
              
              <View className="flex-row justify-between items-center py-2">
                 <View className="flex-row items-center">
                    <View className="bg-amber-50 w-8 h-8 rounded-full items-center justify-center mr-3">
                       <TabBarIcon name="time" color="#d97706" size={16} />
                    </View>
                    <Text className="text-slate-600 font-medium">OT Salary</Text>
                 </View>
                 <Text className="text-slate-900 font-bold">{formatCurrency(salaryPreview.otSalary)}</Text>
              </View>
              <View className="h-[1px] bg-slate-100 my-4" />
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#eef2ff", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e0e7ff" }}>
                <Text style={{ color: "#3730a3", fontWeight: "bold", flex: 1 }}>Total Payout</Text>
                <Text style={{ color: "#4338ca", fontWeight: "900", fontSize: 20 }}>
                  {formatCurrency(salaryPreview.totalSalary)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center shadow-lg mb-10 ${loading ? "bg-indigo-400" : "bg-indigo-600 shadow-indigo-200"}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-extrabold text-[16px]">
              {loading
                ? "Saving..."
                : isUpdateMode
                  ? "Update Attendance"
                  : "Save Attendance"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker ? (
        <DateTimePicker
          value={new Date(`${date}T00:00:00`)}
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
        onConfirm={async () => {
          setConfirmUpdateVisible(false);
          await saveAttendance();
        }}
      />
    </SafeAreaView>
  );
}

