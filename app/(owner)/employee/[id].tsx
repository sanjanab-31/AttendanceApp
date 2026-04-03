import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type QuickFilter = "all" | "today" | "week" | "month" | "custom";
type PickerTarget = "from" | "to" | null;

const parseDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate;
};

const formatDate = (value: any) => {
  const parsedDate = parseDate(value);
  if (!parsedDate) return "N/A";
  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const getRangeForQuickFilter = (filter: QuickFilter) => {
  const today = startOfDay(new Date());

  if (filter === "today") {
    return { from: today, to: endOfDay(today) };
  }

  if (filter === "week") {
    const start = new Date(today);
    const dayIndex = start.getDay();
    const diffFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    start.setDate(start.getDate() - diffFromMonday);
    return { from: startOfDay(start), to: endOfDay(today) };
  }

  if (filter === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: startOfDay(start), to: endOfDay(today) };
  }

  return { from: null, to: null };
};

const formatPickerDate = (value: Date | null) => {
  if (!value) return "Select date";

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function EmployeeHistoryScreen() {
  const { id } = useLocalSearchParams();
  const { employees, attendance, salaryPayments } = useData();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"attendance" | "payments">("attendance");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
  const [customToDate, setCustomToDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const employee = useMemo(
    () => employees.find((emp: any) => emp.id === id),
    [employees, id]
  );

  const activeRange = useMemo(() => {
    if (quickFilter === "custom") {
      return {
        from: customFromDate ? startOfDay(customFromDate) : null,
        to: customToDate ? endOfDay(customToDate) : null,
      };
    }
    return getRangeForQuickFilter(quickFilter);
  }, [customFromDate, customToDate, quickFilter]);

  const employeeAttendance = useMemo(() => {
    if (!employee) return [];
    return attendance
      .filter((record: any) => record.employeeId === employee.id || record.employeeId === employee.employeeId)
      .filter((record: any) => {
        const recordDate = parseDate(record.date);
        if (!recordDate) return false;
        const matchesFrom = !activeRange.from || recordDate >= activeRange.from;
        const matchesTo = !activeRange.to || recordDate <= activeRange.to;
        return matchesFrom && matchesTo;
      })
      .sort((a: any, b: any) => {
        const dateA = parseDate(a.date)?.getTime() || 0;
        const dateB = parseDate(b.date)?.getTime() || 0;
        return dateB - dateA; // Descending
      });
  }, [attendance, employee, activeRange]);

  const employeePayments = useMemo(() => {
    if (!employee) return [];
    return salaryPayments
      .filter((record: any) => record.employeeId === employee.id || record.employeeId === employee.employeeId)
      .filter((record: any) => {
        const recordDate = parseDate(record.paymentDate);
        if (!recordDate) return false;
        const matchesFrom = !activeRange.from || recordDate >= activeRange.from;
        const matchesTo = !activeRange.to || recordDate <= activeRange.to;
        return matchesFrom && matchesTo;
      })
      .sort((a: any, b: any) => {
        const dateA = parseDate(a.paymentDate)?.getTime() || 0;
        const dateB = parseDate(b.paymentDate)?.getTime() || 0;
        return dateB - dateA;
      });
  }, [salaryPayments, employee, activeRange]);

  const handleQuickFilterPress = (filter: QuickFilter) => {
    setQuickFilter(filter);
    if (filter !== "custom") {
      setPickerTarget(null);
    }
  };

  const pickerValue =
    pickerTarget === "from"
      ? customFromDate || new Date()
      : customToDate || customFromDate || new Date();

  const onChangeCustomDate = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setPickerTarget(null);
    }

    if (!selectedDate || !pickerTarget) return;

    if (pickerTarget === "from") {
      const nextFrom = startOfDay(selectedDate);
      setCustomFromDate(nextFrom);

      if (customToDate && nextFrom > endOfDay(customToDate)) {
        setCustomToDate(endOfDay(selectedDate));
      }
      return;
    }

    const nextTo = endOfDay(selectedDate);
    setCustomToDate(nextTo);

    if (customFromDate && nextTo < startOfDay(customFromDate)) {
      setCustomFromDate(startOfDay(selectedDate));
    }
  };

  if (!employee) {
    return (
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#ffffff", flex: 1 }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#334155" }}>Employee Not Found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 16, backgroundColor: "#4f46e5", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderAttendanceItem = ({ item }: { item: any }) => {
    return (
      <View style={{ marginBottom: 16, borderRadius: 24, backgroundColor: "white", padding: 20, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Date
            </Text>
            <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "900", marginTop: 2 }}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", backgroundColor: "#f0fdf4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
            <Text style={{ color: "#16a34a", fontWeight: "900", fontSize: 16 }}>
              {formatCurrency(item.totalSalary || 0)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", padding: 16, borderRadius: 16 }}>
          <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#e2e8f0", marginRight: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Shift</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TabBarIcon name="time-outline" color="#4f46e5" size={14} />
              <Text style={{ marginLeft: 6, fontSize: 15, fontWeight: "bold", color: "#1e293b" }}>{item.shiftHours}h</Text>
            </View>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#e2e8f0", marginRight: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Overtime</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TabBarIcon name="flash-outline" color="#f59e0b" size={14} />
              <Text style={{ marginLeft: 6, fontSize: 15, fontWeight: "bold", color: "#1e293b" }}>{item.otHours}h</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Status</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#16a34a" }}>Present</Text>
          </View>
        </View>

        {item.remarks?.trim() ? (
          <View style={{ backgroundColor: "#fffbeb", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#fef3c7", marginTop: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#b45309", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>Notes</Text>
            <Text style={{ color: "#475569", fontSize: 13, lineHeight: 18, fontStyle: "italic" }}>{item.remarks}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderPaymentItem = ({ item }: { item: any }) => {
    const periodLabel = `${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`;
    const paidDate = formatDate(item.paymentDate);
    const status = String(item.paymentStatus || "unpaid").toLowerCase();
    const isPaid = status === "paid";

    return (
      <View style={{ marginBottom: 16, borderRadius: 24, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "white", padding: 20, elevation: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Period</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#334155" }}>
              {periodLabel}
            </Text>
          </View>
          <View style={[{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1 }, isPaid ? { backgroundColor: "#f0fdf4", borderColor: "#d1fae5" } : { backgroundColor: "#fffbeb", borderColor: "#fef3c7" }]}>
            <Text style={[{ fontSize: 10, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.5 }, isPaid ? { color: "#16a34a" } : { color: "#d97706" }]}>
              {isPaid ? "Paid" : "Unpaid"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f8fafc", marginTop: 8, paddingTop: 16 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Amount</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#4f46e5" }}>
              {formatCurrency(Number(item.paidAmount ?? item.totalSalary ?? 0))}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Released On</Text>
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#475569" }}>{paidDate}</Text>
          </View>
        </View>
      </View>
    );
  };

  const listHeader = (
    <View style={{ marginBottom: 24 }}>
      {/* Filters Section */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "#64748b", fontWeight: "bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>Date Range Filter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
          {[
            { key: "all", label: "All Time" },
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "custom", label: "Custom Range" },
          ].map((filter) => {
            const isActive = quickFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => handleQuickFilterPress(filter.key as QuickFilter)}
                style={{
                  marginRight: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  borderWidth: 1,
                  backgroundColor: isActive ? "#4f46e5" : "white",
                  borderColor: isActive ? "#4f46e5" : "#e2e8f0",
                  elevation: isActive ? 4 : 0
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 13, color: isActive ? "white" : "#475569" }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Custom Range Picker */}
      {quickFilter === "custom" && (
        <View style={{ backgroundColor: "white", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 24, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <TouchableOpacity 
              onPress={() => setPickerTarget("from")}
              style={[{ flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 }, pickerTarget === 'from' ? { borderColor: "#4f46e5", backgroundColor: "rgba(79, 70, 229, 0.03)" } : { borderColor: "#f8fafc", backgroundColor: "#f8fafc" }]}
            >
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Start From</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>{formatPickerDate(customFromDate)}</Text>
            </TouchableOpacity>
            <View style={{ width: 16, height: 1, backgroundColor: "#e2e8f0", marginHorizontal: 8 }} />
            <TouchableOpacity 
              onPress={() => setPickerTarget("to")}
              style={[{ flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 }, pickerTarget === 'to' ? { borderColor: "#4f46e5", backgroundColor: "rgba(79, 70, 229, 0.03)" } : { borderColor: "#f8fafc", backgroundColor: "#f8fafc" }]}
            >
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>End At</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>{formatPickerDate(customToDate)}</Text>
            </TouchableOpacity>
          </View>
          
          {pickerTarget && (
            <View style={{ borderTopWidth: 1, borderTopColor: "#f8fafc", paddingTop: 8 }}>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onChangeCustomDate}
                accentColor="#4f46e5"
              />
              <TouchableOpacity 
                onPress={() => setPickerTarget(null)}
                style={{ marginTop: 8, alignItems: "center", paddingVertical: 8 }}
              >
                <Text style={{ color: "#4f46e5", fontWeight: "bold" }}>Done Selection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: "row", backgroundColor: "white", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1 }}>
        <TouchableOpacity
          onPress={() => setActiveTab("attendance")}
          style={[{ flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 }, activeTab === "attendance" ? { backgroundColor: "#4f46e5", elevation: 2 } : { backgroundColor: "transparent" }]}
        >
          <Text style={[{ fontSize: 14, fontWeight: "bold" }, activeTab === "attendance" ? { color: "white" } : { color: "#64748b" }]}>
            Attendance ({employeeAttendance.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("payments")}
          style={[{ flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 }, activeTab === "payments" ? { backgroundColor: "#4f46e5", elevation: 2 } : { backgroundColor: "transparent" }]}
        >
          <Text style={[{ fontSize: 14, fontWeight: "bold" }, activeTab === "payments" ? { color: "white" } : { color: "#64748b" }]}>
            Payments ({employeePayments.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={{ backgroundColor: "white", paddingHorizontal: 24, paddingVertical: 20, zIndex: 1, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ width: 40, height: 40, backgroundColor: "white", borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e8f0", marginRight: 16, elevation: 1 }}
          >
            <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>Profile Overview</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ height: 64, width: 64, borderRadius: 20, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Text style={{ color: "#4f46e5", fontWeight: "900", fontSize: 24 }}>
              {employee.name?.charAt(0) || "U"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0f172a" }}>{employee.name}</Text>
            <Text style={{ color: "#64748b", fontSize: 14, fontWeight: "500", marginTop: 2 }}>{employee.email}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 }}>
                <Text style={{ color: "#475569", fontSize: 11, fontWeight: "bold" }}>
                  ID: {employee.employeeId}
                </Text>
              </View>
              <Text style={{ color: "#059669", fontSize: 13, fontWeight: "bold" }}>
                {formatCurrency(employee.hourlyRate)}/hr
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === "attendance" ? employeeAttendance : employeePayments}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === "attendance" ? renderAttendanceItem : renderPaymentItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: "center", borderRadius: 24, borderStyle: "dashed", borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "white", paddingHorizontal: 24, paddingVertical: 48 }}>
            <View style={{ backgroundColor: "#f8fafc", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
               <TabBarIcon name={activeTab === "attendance" ? "calendar-outline" : "receipt-outline"} color="#94a3b8" size={28} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#334155" }}>
              No {activeTab === "attendance" ? "Attendance" : "Payment"} Records
            </Text>
            <Text style={{ marginTop: 4, textAlign: "center", fontSize: 13, color: "#64748b", fontWeight: "500" }}>
              There are no {activeTab === "attendance" ? "shifts" : "salary payouts"} matching the date filter yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
