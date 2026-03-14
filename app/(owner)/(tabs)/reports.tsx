import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

type PickerTarget = "from" | "to" | null;

const parseRecordDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);

const endOfDay = (value: Date) =>
  new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );

const formatDateLabel = (value: Date | null) => {
  if (!value) return "Pick Date";
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Reports() {
  const { employees, attendance, bonuses } = useData();
  const insets = useSafeAreaInsets();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const selectedEmployee =
    selectedEmployeeId === "all"
      ? null
      : employees.find((e: any) => e.id === selectedEmployeeId);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record: any) => {
      if (
        selectedEmployee &&
        record.employeeId !== selectedEmployee.employeeId
      ) {
        return false;
      }

      const recordDate = parseRecordDate(record.date);
      if (!recordDate) return false;

      if (fromDate && recordDate < startOfDay(fromDate)) return false;
      if (toDate && recordDate > endOfDay(toDate)) return false;

      return true;
    });
  }, [attendance, fromDate, selectedEmployee, toDate]);

  const filteredBonuses = useMemo(() => {
    return bonuses.filter((bonus: any) => {
      if (
        selectedEmployee &&
        bonus.employeeId !== selectedEmployee.employeeId
      ) {
        return false;
      }

      const bonusDate = parseRecordDate(bonus.toDate);
      if (!bonusDate) return false;

      if (fromDate && bonusDate < startOfDay(fromDate)) return false;
      if (toDate && bonusDate > endOfDay(toDate)) return false;

      return true;
    });
  }, [bonuses, fromDate, selectedEmployee, toDate]);

  const stats = {
    totalEmployees: selectedEmployee ? 1 : employees.length,
    totalAttendance: filteredAttendance.length,
    shiftHours: filteredAttendance.reduce(
      (acc: number, record: any) => acc + Number(record.shiftHours || 0),
      0,
    ),
    totalSalary: filteredAttendance.reduce(
      (acc: number, record: any) => acc + Number(record.totalSalary || 0),
      0,
    ),
    totalBonus: filteredBonuses.reduce(
      (acc: number, bonus: any) => acc + Number(bonus.bonusAmount || 0),
      0,
    ),
  };

  const reportRows = [...filteredAttendance].sort((left: any, right: any) => {
    const leftDate = parseRecordDate(left.date)?.getTime() || 0;
    const rightDate = parseRecordDate(right.date)?.getTime() || 0;
    return rightDate - leftDate;
  });

  const pickerValue =
    pickerTarget === "from"
      ? fromDate || new Date()
      : toDate || fromDate || new Date();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a", marginBottom: 24 }}>Reports</Text>

        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Date Filtration</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setPickerTarget("from")}
              style={{ flex: 1, backgroundColor: "#f8fafc", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", marginRight: 8 }}
            >
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>From</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>{formatDateLabel(fromDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPickerTarget("to")}
              style={{ flex: 1, backgroundColor: "#f8fafc", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", marginLeft: 8 }}
            >
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>To</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>{formatDateLabel(toDate)}</Text>
            </TouchableOpacity>
          </View>

          {pickerTarget && (
            <View style={{ backgroundColor: "#f8fafc", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#f1f5f9" }}>
               <DateTimePicker
                 value={pickerValue}
                 mode="date"
                 display={Platform.OS === "ios" ? "inline" : "default"}
                 onChange={(_event, selectedDate) => {
                   if (Platform.OS === "android") setPickerTarget(null);
                   if (!selectedDate) return;

                   if (pickerTarget === "from") {
                     const nextFrom = startOfDay(selectedDate);
                     setFromDate(nextFrom);
                     if (toDate && nextFrom > endOfDay(toDate)) {
                       setToDate(endOfDay(selectedDate));
                     }
                   } else {
                     const nextTo = endOfDay(selectedDate);
                     setToDate(nextTo);
                     if (fromDate && nextTo < startOfDay(fromDate)) {
                       setFromDate(startOfDay(selectedDate));
                     }
                   }
                   if (Platform.OS === "ios" && _event.type === "set") setPickerTarget(null);
                 }}
               />
            </View>
          )}

          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 12 }}>Staff Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => setSelectedEmployeeId("all")}
              style={{
                marginRight: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                backgroundColor: selectedEmployeeId === "all" ? "#4f46e5" : "white",
                borderColor: selectedEmployeeId === "all" ? "#4f46e5" : "#f1f5f9"
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 12, color: selectedEmployeeId === "all" ? "white" : "#475569" }}>
                All Staff
              </Text>
            </TouchableOpacity>
            {employees.map((employee: any) => {
              const active = selectedEmployeeId === employee.id;
              return (
                <TouchableOpacity
                  key={employee.id}
                  onPress={() => setSelectedEmployeeId(employee.id)}
                  style={{
                    marginRight: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    backgroundColor: active ? "#4f46e5" : "white",
                    borderColor: active ? "#4f46e5" : "#f1f5f9"
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 12, color: active ? "white" : "#475569" }}>
                    {employee.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ width: "48%", backgroundColor: "white", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 16 }}>
            <View style={{ backgroundColor: "#eef2ff", width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
               <TabBarIcon name="people" color="#4f46e5" size={16} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Staff Count</Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>{stats.totalEmployees}</Text>
          </View>
          <View style={{ width: "48%", backgroundColor: "white", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 16 }}>
            <View style={{ backgroundColor: "#fffbeb", width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
               <TabBarIcon name="calendar" color="#d97706" size={16} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Sessions</Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>{stats.totalAttendance}</Text>
          </View>
          <View style={{ width: "48%", backgroundColor: "white", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 16 }}>
            <View style={{ backgroundColor: "#ecfdf5", width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
               <TabBarIcon name="time" color="#059669" size={16} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Work Hours</Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>{stats.shiftHours}h</Text>
          </View>
          <View style={{ width: "48%", backgroundColor: "white", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 16 }}>
            <View style={{ backgroundColor: "#fff1f2", width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
               <TabBarIcon name="cash" color="#e11d48" size={16} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Total Cost</Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>
              {formatCurrency(stats.totalSalary + stats.totalBonus)}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 32, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 80 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
             <Text style={{ fontSize: 16, fontWeight: "900", color: "#0f172a" }}>Activity Log</Text>
             <TouchableOpacity style={{ backgroundColor: "#eef2ff", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: "#4f46e5", fontWeight: "bold", fontSize: 11, textTransform: "uppercase" }}>Details</Text>
             </TouchableOpacity>
          </View>

          {reportRows.length > 0 ? (
            reportRows.map((item: any, index: number) => (
              <View
                key={item.id}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: index !== reportRows.length - 1 ? 1 : 0,
                  borderBottomColor: "#f8fafc"
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                   <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>{item.employeeName}</Text>
                   <Text style={{ fontSize: 14, fontWeight: "900", color: "#4f46e5" }}>
                     {formatCurrency(Number(item.totalSalary || 0))}
                   </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                   <Text style={{ fontSize: 12, fontWeight: "500", color: "#94a3b8" }}>
                     {parseRecordDate(item.date)?.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) || "N/A"}
                   </Text>
                   <Text style={{ fontSize: 12, fontWeight: "bold", color: "#64748b" }}>
                     {item.shiftHours}h Shift {item.otHours > 0 ? `+ ${item.otHours}h OT` : ''}
                   </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <View style={{ backgroundColor: "#f8fafc", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <TabBarIcon name="document-text" color="#cbd5e1" size={32} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#94a3b8" }}>No activity data found</Text>
              <Text style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Try adjusting your filters</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

