import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { calculateTotalShiftHours } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { StatusBar } from "expo-status-bar";

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string) => {
   if (!dateStr) return "Select Date";
   const [year, month, day] = dateStr.split("-").map(Number);
   const date = new Date(year, month - 1, day);
   return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
   });
};

export default function BonusManagement() {
  const { employees, attendance, addBonus } = useData();
  const router = useRouter();
  const { showToast } = useToast();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [bonusAmount, setBonusAmount] = useState("");
  const [isCalculated, setIsCalculated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const selectedEmployee = employees.find(
    (e: any) => e.id === selectedEmployeeId,
  );

  const filteredAttendance = attendance.filter((record: any) => {
    if (!selectedEmployee || !fromDate || !toDate) return false;
    const date = record.date?.toDate?.() || new Date(record.date);
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59`);
    return (
      record.employeeId === selectedEmployee.employeeId &&
      date >= start &&
      date <= end
    );
  });

  const totalShiftHours = calculateTotalShiftHours(filteredAttendance);

  const handleCalculate = () => {
    if (!selectedEmployeeId || !fromDate || !toDate) {
      showToast("Please select employee and date range", "error");
      return;
    }
    
    if (new Date(fromDate) > new Date(toDate)) {
      showToast("From date cannot be after To date", "error");
      return;
    }
    
    setIsCalculated(true);
  };

  const handleSaveBonus = async () => {
    if (!bonusAmount) {
      showToast("Please enter a bonus amount", "error");
      return;
    }

    setLoading(true);
    try {
      await addBonus({
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        fromDate,
        toDate,
        totalShiftHours,
        bonusAmount: parseFloat(bonusAmount),
      });

      showToast("Bonus assigned successfully", "success");
      setBonusAmount("");
      setIsCalculated(false);
      router.back();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderDatePicker = (show: boolean, valueStr: string, isFrom: boolean) => {
    if (!show) return null;
    
    const valueStrValid = valueStr ? valueStr : toDateKey(new Date());
    const val = new Date(`${valueStrValid}T00:00:00`);

    return (
      <DateTimePicker
        value={val}
        mode="date"
        display={Platform.OS === "ios" ? "inline" : "default"}
        onChange={(_, selectedDate) => {
          if (Platform.OS === "android") {
            isFrom ? setShowFromPicker(false) : setShowToPicker(false);
          }
          if (!selectedDate) return;
          const key = toDateKey(selectedDate);
          
          if (isFrom) {
             setFromDate(key);
             if (toDate && new Date(key) > new Date(toDate)) setToDate(key);
          } else {
             setToDate(key);
             if (fromDate && new Date(key) < new Date(fromDate)) setFromDate(key);
          }
          setIsCalculated(false);
        }}
      />
    );
  };

  return (
    <SafeAreaView edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center px-6 py-4">
         <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-200 shadow-sm"
         >
            <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
         </TouchableOpacity>
         <View className="ml-4">
            <Text className="text-xl font-extrabold text-slate-900">Assign Bonus</Text>
            <Text className="text-[13px] text-slate-500 font-medium mt-0.5">Reward staff for performance</Text>
         </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 24, elevation: 2, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 24 }}>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            1. Select Staff Member
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {employees.map((emp: any) => {
              const active = selectedEmployeeId === emp.id;
              return (
                <TouchableOpacity
                  key={emp.id}
                  onPress={() => {
                    setSelectedEmployeeId(emp.id);
                    setIsCalculated(false);
                  }}
                  className={`mr-3 px-5 py-3 rounded-2xl border ${active ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100" : "bg-white border-slate-200"}`}
                >
                  <Text
                    className={`font-bold text-[13px] ${active ? "text-white" : "text-slate-600"}`}
                  >
                    {emp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            2. Select Period
          </Text>
          <View className="flex-row space-x-4 mb-6">
            <TouchableOpacity 
               className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 mr-2 items-center"
               onPress={() => setShowFromPicker(true)}
            >
              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2">From</Text>
              <Text className={`text-[14px] font-bold ${fromDate ? "text-slate-800" : "text-slate-400"}`}>
                 {formatDateDisplay(fromDate)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
               className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 ml-2 items-center"
               onPress={() => setShowToPicker(true)}
            >
              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2">To</Text>
              <Text className={`text-[14px] font-bold ${toDate ? "text-slate-800" : "text-slate-400"}`}>
                 {formatDateDisplay(toDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {renderDatePicker(showFromPicker, fromDate, true)}
          {renderDatePicker(showToPicker, toDate, false)}

          <TouchableOpacity
            onPress={handleCalculate}
            className="bg-slate-900 p-4 rounded-2xl items-center shadow-lg shadow-slate-200"
          >
            <Text className="text-white font-extrabold text-[15px]">Calculate Shifts</Text>
          </TouchableOpacity>
        </View>

        {isCalculated && (
          <View style={{ backgroundColor: "white", padding: 24, borderRadius: 32, elevation: 2, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 40, alignItems: "center" }}>
            <View className="w-16 h-16 bg-indigo-50 rounded-full items-center justify-center mb-4">
               <TabBarIcon name="time" color="#4f46e5" size={32} />
            </View>
            
            <Text className="text-[13px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
              Total Recorded Shifts
            </Text>
            <Text className="text-[36px] font-black text-indigo-600 mb-1 tracking-tighter">
              {totalShiftHours} <Text className="text-[16px] text-indigo-400">hrs</Text>
            </Text>
            <Text className="text-slate-400 text-[11px] font-medium mb-6">
              Between {formatDateDisplay(fromDate)} - {formatDateDisplay(toDate)}
            </Text>

            <View className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
               <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                 3. Set Bonus Amount
               </Text>
               <TextInput
                 className="bg-white p-4 rounded-2xl border border-slate-200 text-2xl font-black text-center text-slate-800 shadow-sm"
                 placeholder="â‚¹ 0.00"
                 placeholderTextColor="#cbd5e1"
                 keyboardType="numeric"
                 value={bonusAmount}
                 onChangeText={setBonusAmount}
               />
            </View>

            <TouchableOpacity
              onPress={handleSaveBonus}
              disabled={loading}
              className={`w-full p-4 rounded-2xl items-center shadow-lg flex-row justify-center ${loading ? "bg-emerald-400" : "bg-emerald-600 shadow-emerald-200"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <TabBarIcon name="checkmark-circle" color="white" size={20} />
                  <Text className="text-white font-extrabold text-[16px] ml-2">
                    Confirm & Save Bonus
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

