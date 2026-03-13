import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      <View className="mb-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[16px] font-bold text-slate-900">
              {item.employeeName}
            </Text>
            <View className="mt-1 flex-row items-center">
              <TabBarIcon name="calendar-outline" color="#64748b" size={15} />
              <Text className="ml-1 text-xs font-medium text-slate-500">
                {formatAttendanceDate(item.date)}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl bg-emerald-50 px-3 py-2">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Salary
            </Text>
            <Text className="mt-0.5 text-base font-bold text-emerald-700">
              {formatCurrency(item.totalSalary || 0)}
            </Text>
          </View>
        </View>

        <View className="mt-3 rounded-2xl bg-slate-50 px-3 py-3">
          <View className="flex-row items-center justify-between">
            <View className="mr-2 flex-1 rounded-xl bg-white px-3 py-2">
              <View className="flex-row items-center">
                <TabBarIcon name="time-outline" color="#2563eb" size={15} />
                <Text className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Shift
                </Text>
              </View>
              <Text className="mt-1 text-sm font-bold text-slate-800">
                {item.shiftHours || 0}h
              </Text>
            </View>

            <View className="ml-2 flex-1 rounded-xl bg-white px-3 py-2">
              <View className="flex-row items-center">
                <TabBarIcon name="timer-outline" color="#f97316" size={15} />
                <Text className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  OT
                </Text>
              </View>
              <Text className="mt-1 text-sm font-bold text-slate-800">
                {item.otHours || 0}h
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between rounded-xl bg-white px-3 py-2.5">
            <View className="flex-row items-center">
              <TabBarIcon name="wallet-outline" color="#7c3aed" size={15} />
              <Text className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Hourly Rate
              </Text>
            </View>
            <Text className="text-sm font-bold text-slate-800">
              ₹{hourlyRate}/hr
            </Text>
          </View>
        </View>

        <View className="mt-3 rounded-2xl bg-slate-50 px-3 py-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Remarks
          </Text>
          <Text className="mt-1 text-sm text-slate-700">
            {item.remarks?.trim() ? item.remarks : "None"}
          </Text>
        </View>
      </View>
    );
  };

  const listHeader = (
    <View className="pb-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[28px] font-bold text-slate-900">
            Attendance History
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            Search and filter attendance records across all employees.
          </Text>
        </View>

        <Pressable
          onPress={clearFilters}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
        >
          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Clear
          </Text>
        </Pressable>
      </View>

      <View className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          <TabBarIcon name="search" color="#94a3b8" size={18} />
          <TextInput
            className="ml-2 flex-1 text-[14px] text-slate-800"
            placeholder="Search by employee name"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[1px] text-slate-500">
          Employee Filter
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          {employeeChips.map((employee: any) => {
            const isActive = selectedEmployeeId === employee.id;
            return (
              <Pressable
                key={employee.id}
                onPress={() => setSelectedEmployeeId(employee.id)}
                className={`mr-2 rounded-full border px-4 py-2.5 ${isActive ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"}`}
              >
                <Text
                  className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-700"}`}
                >
                  {employee.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[1px] text-slate-500">
          Date Filters
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          {[
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "custom", label: "Custom" },
          ].map((filter) => {
            const isActive = quickFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() =>
                  handleQuickFilterPress(filter.key as QuickFilter)
                }
                className={`mr-2 rounded-full border px-4 py-2.5 ${isActive ? "border-emerald-600 bg-emerald-600" : "border-slate-200 bg-white"}`}
              >
                <Text
                  className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-700"}`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {quickFilter === "custom" ? (
          <View className="mt-4 rounded-[20px] bg-slate-50 p-3">
            <View className="flex-row">
              <Pressable
                onPress={() => setPickerTarget("from")}
                className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3"
              >
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  From Date
                </Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-800">
                    {formatPickerDate(customFromDate)}
                  </Text>
                  <TabBarIcon
                    name="calendar-outline"
                    color="#2563eb"
                    size={16}
                  />
                </View>
              </Pressable>

              <Pressable
                onPress={() => setPickerTarget("to")}
                className="ml-2 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3"
              >
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  To Date
                </Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-800">
                    {formatPickerDate(customToDate)}
                  </Text>
                  <TabBarIcon
                    name="calendar-outline"
                    color="#2563eb"
                    size={16}
                  />
                </View>
              </Pressable>
            </View>

            {pickerTarget ? (
              <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-2 py-2">
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={onChangeCustomDate}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="mt-4 flex-row items-center justify-between px-1">
        <Text className="text-sm font-semibold text-slate-700">
          {filteredAttendance.length} records found
        </Text>
        <View className="rounded-full bg-slate-200 px-3 py-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Latest first
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-slate-50">
      <FlatList
        data={filteredAttendance}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 88,
        }}
        ListEmptyComponent={
          <View className="mt-4 items-center rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10">
            <TabBarIcon
              name="calendar-clear-outline"
              color="#cbd5e1"
              size={44}
            />
            <Text className="mt-3 text-base font-bold text-slate-700">
              No attendance records found
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-500">
              Try a different employee, search term, or date range.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
