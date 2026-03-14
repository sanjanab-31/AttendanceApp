import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

type QuickFilter = "all" | "today" | "week" | "month" | "custom";
type PickerTarget = "from" | "to" | null;

const parseRecordDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate;
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

const formatAttendanceDate = (value: any) => {
  const parsedDate = parseRecordDate(value);
  if (!parsedDate) return "Invalid date";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatPickerDate = (value: Date | null) => {
  if (!value) return "Select date";

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AttendanceHistory() {
  const { attendance, employees } = useData();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
  const [customToDate, setCustomToDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const employeeChips = useMemo(
    () => [
      { id: "all", label: "All Employees" },
      ...employees
        .map((employee: any) => ({
          id: employee.employeeId || employee.id,
          label: employee.name,
        }))
        .sort((left: any, right: any) => left.label.localeCompare(right.label)),
    ],
    [employees],
  );

  const employeeRateMap = useMemo(
    () =>
      new Map(
        employees.map((employee: any) => [
          employee.employeeId,
          employee.hourlyRate,
        ]),
      ),
    [employees],
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

  const filteredAttendance = useMemo(() => {
    return attendance
      .filter((record: any) => {
        const employeeName = String(record.employeeName || "").toLowerCase();
        const matchesSearch = employeeName.includes(
          search.trim().toLowerCase(),
        );
        const matchesEmployee =
          selectedEmployeeId === "all" ||
          record.employeeId === selectedEmployeeId;

        const recordDate = parseRecordDate(record.date);
        if (!recordDate) return false;

        const matchesFrom = !activeRange.from || recordDate >= activeRange.from;
        const matchesTo = !activeRange.to || recordDate <= activeRange.to;

        return matchesSearch && matchesEmployee && matchesFrom && matchesTo;
      })
      .sort((left: any, right: any) => {
        const leftDate = parseRecordDate(left.date)?.getTime() || 0;
        const rightDate = parseRecordDate(right.date)?.getTime() || 0;
        return rightDate - leftDate;
      });
  }, [
    activeRange.from,
    activeRange.to,
    attendance,
    search,
    selectedEmployeeId,
  ]);

  const handleQuickFilterPress = (filter: QuickFilter) => {
    setQuickFilter(filter);
    if (filter !== "custom") {
      setPickerTarget(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedEmployeeId("all");
    setQuickFilter("all");
    setCustomFromDate(null);
    setCustomToDate(null);
    setPickerTarget(null);
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

  const renderItem = ({ item }: { item: any }) => {
    const hourlyRate = employeeRateMap.get(item.employeeId) ?? 0;

    return (
      <View style={{ marginBottom: 16, borderRadius: 24, backgroundColor: "white", padding: 20, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "bold", color: "#0f172a" }}>
            {item.employeeName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <View style={{ backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
              <Text style={{ color: "#4f46e5", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {item.employeeId}
              </Text>
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "500" }}>
              {formatAttendanceDate(item.date)}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", backgroundColor: "#ecfdf5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
          <Text style={{ color: "#059669", fontWeight: "900", fontSize: 16 }}>
            {formatCurrency(item.totalSalary || 0)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", padding: 16, borderRadius: 16, marginBottom: 16 }}>
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
           <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Base Rate</Text>
           <Text style={{ fontSize: 15, fontWeight: "bold", color: "#1e293b" }}>₹{hourlyRate}/h</Text>
        </View>
      </View>

      {item.remarks?.trim() ? (
        <View style={{ backgroundColor: "#fffbeb", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#fef3c7" }}>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#b45309", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>Notes</Text>
          <Text style={{ color: "#475569", fontSize: 13, lineHeight: 18, fontStyle: "italic" }}>{item.remarks}</Text>
        </View>
      ) : null}
      </View>
    );
  };

  const listHeader = (
    <View style={{ padding: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a" }}>History</Text>
        <TouchableOpacity 
          onPress={clearFilters}
          style={{ backgroundColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}
        >
          <Text style={{ color: "#475569", fontWeight: "bold", fontSize: 12 }}>Reset All</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: "#64748b", fontWeight: "500", fontSize: 15, marginBottom: 32, lineHeight: 22 }}>
        Trace and manage all attendance contributions and payouts.
      </Text>

      {/* Search Bar */}
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#f1f5f9", padding: 8, borderRadius: 16, elevation: 1, flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
         <View className="w-10 h-10 items-center justify-center">
            <TabBarIcon name="search" color="#94a3b8" size={18} />
         </View>
         <TextInput
            style={{ flex: 1, fontSize: 15, fontWeight: "500", color: "#0f172a", paddingHorizontal: 8 }}
            placeholder="Filter by name..."
            placeholderTextColor="#cbd5e1"
            value={search}
            onChangeText={setSearch}
         />
      </View>

      {/* Employee Chips */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "#64748b", fontWeight: "bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>Member</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
          {employeeChips.map((employee: any) => {
            const isActive = selectedEmployeeId === employee.id;
            return (
              <TouchableOpacity
                key={employee.id}
                onPress={() => setSelectedEmployeeId(employee.id)}
                style={{
                  marginRight: 10,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 16,
                  borderWidth: 1,
                  backgroundColor: isActive ? "#4f46e5" : "white",
                  borderColor: isActive ? "#4f46e5" : "#f1f5f9",
                  elevation: isActive ? 4 : 0
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 13, color: isActive ? "white" : "#475569" }}>
                  {employee.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Date Filter Chips */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "#64748b", fontWeight: "bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>Interval</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
          {[
            { key: "all", label: "Full Scan" },
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "custom", label: "Range Selection" },
          ].map((filter) => {
            const isActive = quickFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => handleQuickFilterPress(filter.key as QuickFilter)}
                style={{
                  marginRight: 10,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 16,
                  borderWidth: 1,
                  backgroundColor: isActive ? "#4f46e5" : "white",
                  borderColor: isActive ? "#4f46e5" : "#f1f5f9",
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
        <View style={{ backgroundColor: "white", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 24, elevation: 1 }}>
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

      {/* Result Meta */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 8, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "bold", color: "#94a3b8" }}>
           Found {filteredAttendance.length} records
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "bold", color: "#94a3b8", fontStyle: "italic" }}>
          Newest entries first
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <FlatList
        data={filteredAttendance}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          <View style={{ marginHorizontal: 24, alignItems: "center", justifyContent: "center", paddingVertical: 80, backgroundColor: "white", borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", borderStyle: "dashed" }}>
            <View style={{ width: 64, height: 64, backgroundColor: "#f8fafc", borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <TabBarIcon name="calendar-clear-outline" color="#cbd5e1" size={32} />
            </View>
            <Text style={{ color: "#1e293b", fontWeight: "bold", fontSize: 18 }}>No Results Found</Text>
            <Text style={{ color: "#94a3b8", textAlign: "center", paddingHorizontal: 32, marginTop: 8, lineHeight: 20 }}>
              We couldn't find any logs matching your current filters. Try relaxing the search parameters.
            </Text>
          </View>
        }
      />
    </View>
  );
}
