import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type QuickFilter = "all" | "today" | "week" | "month";

const parseRecordDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string) => {
  if (!value) return null;

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const getDateRangeForQuickFilter = (filter: QuickFilter) => {
  const today = new Date();
  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (filter === "today") {
    const dateKey = toDateKey(currentDay);
    return { fromDate: dateKey, toDate: dateKey };
  }

  if (filter === "week") {
    const dayIndex = currentDay.getDay();
    const diffFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    const weekStart = new Date(currentDay);
    weekStart.setDate(currentDay.getDate() - diffFromMonday);
    return { fromDate: toDateKey(weekStart), toDate: toDateKey(currentDay) };
  }

  if (filter === "month") {
    const monthStart = new Date(
      currentDay.getFullYear(),
      currentDay.getMonth(),
      1,
    );
    return { fromDate: toDateKey(monthStart), toDate: toDateKey(currentDay) };
  }

  return { fromDate: "", toDate: "" };
};

const formatAttendanceDate = (value: any) => {
  const parsedDate = parseRecordDate(value);
  if (!parsedDate) {
    return "Invalid date";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AttendanceHistory() {
  const { attendance, employees } = useData();
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const employeeChips = [
    { id: "all", label: "All Employees" },
    ...employees
      .map((employee: any) => ({
        id: employee.employeeId || employee.id,
        label: employee.name,
      }))
      .sort((left: any, right: any) => left.label.localeCompare(right.label)),
  ];

  const filteredAttendance = attendance
    .filter((record: any) => {
      const matchesSearch = record.employeeName
        ?.toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesEmployee =
        selectedEmployeeId === "all" ||
        record.employeeId === selectedEmployeeId;

      const recordDate = parseRecordDate(record.date);
      if (!recordDate) {
        return false;
      }

      const from = parseInputDate(fromDate);
      const to = parseInputDate(toDate);

      const matchesFromDate = !from || recordDate >= from;
      const matchesToDate =
        !to ||
        recordDate <=
          new Date(
            to.getFullYear(),
            to.getMonth(),
            to.getDate(),
            23,
            59,
            59,
            999,
          );

      return (
        matchesSearch && matchesEmployee && matchesFromDate && matchesToDate
      );
    })
    .sort((left: any, right: any) => {
      const leftDate = parseRecordDate(left.date)?.getTime() || 0;
      const rightDate = parseRecordDate(right.date)?.getTime() || 0;
      return rightDate - leftDate;
    });

  const handleQuickFilterPress = (filter: QuickFilter) => {
    setQuickFilter(filter);
    const range = getDateRangeForQuickFilter(filter);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedEmployeeId("all");
    setQuickFilter("all");
    setFromDate("");
    setToDate("");
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white px-4 py-3 rounded-2xl shadow-sm mb-2 border border-gray-100">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-gray-900">
            {item.employeeName}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {formatAttendanceDate(item.date)}
          </Text>
        </View>
        <Text className="text-lg font-bold text-blue-700">
          {formatCurrency(item.totalSalary || 0)}
        </Text>
      </View>

      <View className="flex-row mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
        <View className="flex-1">
          <Text className="text-[11px] uppercase font-bold text-gray-400">
            Shift
          </Text>
          <Text className="text-sm font-semibold text-gray-700">
            {item.shiftHours || 0}h
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[11px] uppercase font-bold text-gray-400">
            OT
          </Text>
          <Text className="text-sm font-semibold text-gray-700">
            {item.otHours || 0}h
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[11px] uppercase font-bold text-gray-400">
            Rate
          </Text>
          <Text className="text-sm font-semibold text-gray-700">
            ₹
            {employees.find(
              (employee: any) => employee.employeeId === item.employeeId,
            )?.hourlyRate ?? 0}
            /hr
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Total Salary
        </Text>
        <Text className="text-sm font-bold text-emerald-600">
          {formatCurrency(item.totalSalary || 0)}
        </Text>
      </View>

      <View className="mt-2 rounded-xl bg-gray-50 px-3 py-2">
        <Text className="text-[11px] uppercase font-bold text-gray-400 mb-1">
          Remarks
        </Text>
        <Text className="text-sm text-gray-600">
          {item.remarks?.trim() ? item.remarks : "None"}
        </Text>
      </View>
    </View>
  );

  const header = (
    <View className="pb-3">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-2xl font-bold text-gray-800">
          Attendance History
        </Text>
        <TouchableOpacity
          onPress={handleClearFilters}
          className="px-3 py-2 rounded-xl bg-gray-200"
        >
          <Text className="text-xs font-semibold text-gray-700">
            Clear Filters
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-white border border-gray-200 px-3 py-2.5 rounded-2xl mb-3 shadow-sm">
        <TabBarIcon name="search" color="#9ca3af" size={18} />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Search by employee name"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
        Employee Filter
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
      >
        {employeeChips.map((employee: any) => {
          const isActive = selectedEmployeeId === employee.id;
          return (
            <TouchableOpacity
              key={employee.id}
              onPress={() => setSelectedEmployeeId(employee.id)}
              className={`mr-2 rounded-full px-4 py-2 border ${isActive ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}
            >
              <Text
                className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-700"}`}
              >
                {employee.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
        Date Filters
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
      >
        {[
          { key: "all", label: "All Dates" },
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "month", label: "This Month" },
        ].map((filter) => {
          const isActive = quickFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => handleQuickFilterPress(filter.key as QuickFilter)}
              className={`mr-2 rounded-full px-4 py-2 border ${isActive ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-200"}`}
            >
              <Text
                className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-700"}`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="flex-row mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            From Date
          </Text>
          <TextInput
            className="bg-white border border-gray-200 px-3 py-2.5 rounded-2xl text-gray-800"
            placeholder="YYYY-MM-DD"
            value={fromDate}
            onChangeText={setFromDate}
          />
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            To Date
          </Text>
          <TextInput
            className="bg-white border border-gray-200 px-3 py-2.5 rounded-2xl text-gray-800"
            placeholder="YYYY-MM-DD"
            value={toDate}
            onChangeText={setToDate}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-sm font-semibold text-gray-700">
          {filteredAttendance.length} records
        </Text>
        <Text className="text-xs text-gray-500">Latest first</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <FlatList
        data={filteredAttendance}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 88,
        }}
        ListEmptyComponent={
          <View className="items-center justify-center rounded-3xl bg-white border border-dashed border-gray-200 px-6 py-10 mt-4">
            <TabBarIcon name="calendar-outline" color="#d1d5db" size={48} />
            <Text className="text-gray-500 mt-3 text-base font-semibold">
              No attendance records found
            </Text>
            <Text className="text-gray-400 mt-1 text-center text-sm">
              Try another employee, search term, or date range.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
