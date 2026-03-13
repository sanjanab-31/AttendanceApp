import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  if (!value) return "Select date";
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Reports() {
  const { employees, attendance, bonuses } = useData();
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-slate-50">
      <ScrollView className="px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-[24px] font-bold text-slate-900">
          Business Reports
        </Text>

        <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <Text className="text-[17px] font-semibold text-slate-900">
            Filters
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ paddingRight: 4 }}
          >
            <Pressable
              onPress={() => setSelectedEmployeeId("all")}
              className={`mr-2 rounded-full border px-4 py-2.5 ${selectedEmployeeId === "all" ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"}`}
            >
              <Text
                className={`text-[13px] font-semibold ${selectedEmployeeId === "all" ? "text-white" : "text-slate-700"}`}
              >
                All Employees
              </Text>
            </Pressable>
            {employees.map((employee: any) => {
              const active = selectedEmployeeId === employee.id;
              return (
                <Pressable
                  key={employee.id}
                  onPress={() => setSelectedEmployeeId(employee.id)}
                  className={`mr-2 rounded-full border px-4 py-2.5 ${active ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"}`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${active ? "text-white" : "text-slate-700"}`}
                  >
                    {employee.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="mt-4 flex-row">
            <Pressable
              onPress={() => setPickerTarget("from")}
              className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                From Date
              </Text>
              <Text className="mt-1 text-[14px] font-semibold text-slate-800">
                {formatDateLabel(fromDate)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerTarget("to")}
              className="ml-2 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                To Date
              </Text>
              <Text className="mt-1 text-[14px] font-semibold text-slate-800">
                {formatDateLabel(toDate)}
              </Text>
            </Pressable>
          </View>

          {pickerTarget ? (
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-2">
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
                    return;
                  }

                  const nextTo = endOfDay(selectedDate);
                  setToDate(nextTo);
                  if (fromDate && nextTo < startOfDay(fromDate)) {
                    setFromDate(startOfDay(selectedDate));
                  }
                }}
              />
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row flex-wrap justify-between">
          <View className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[12px] text-slate-500">Total Employees</Text>
            <Text className="mt-1 text-[18px] font-semibold text-slate-900">
              {stats.totalEmployees}
            </Text>
          </View>
          <View className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[12px] text-slate-500">Total Attendance</Text>
            <Text className="mt-1 text-[18px] font-semibold text-slate-900">
              {stats.totalAttendance}
            </Text>
          </View>
          <View className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[12px] text-slate-500">
              Total Shift Hours
            </Text>
            <Text className="mt-1 text-[18px] font-semibold text-slate-900">
              {stats.shiftHours}h
            </Text>
          </View>
          <View className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[12px] text-slate-500">Total Salary</Text>
            <Text className="mt-1 text-[18px] font-semibold text-emerald-700">
              {formatCurrency(stats.totalSalary + stats.totalBonus)}
            </Text>
          </View>
        </View>

        <View className="mb-24 mt-2 rounded-3xl border border-slate-200 bg-white p-4">
          <Text className="text-[17px] font-semibold text-slate-900">
            Detailed Breakdown
          </Text>

          {reportRows.length > 0 ? (
            reportRows.map((item: any, index: number) => (
              <View
                key={item.id}
                className={`py-3 ${index !== reportRows.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[15px] font-semibold text-slate-900">
                      {item.employeeName}
                    </Text>
                    <Text className="mt-1 text-[13px] text-slate-500">
                      {parseRecordDate(item.date)?.toLocaleDateString(
                        "en-IN",
                      ) || "N/A"}
                    </Text>
                  </View>
                  <Text className="text-[14px] font-semibold text-emerald-700">
                    {formatCurrency(Number(item.totalSalary || 0))}
                  </Text>
                </View>
                <Text className="mt-2 text-[13px] text-slate-600">
                  Shift: {Number(item.shiftHours || 0)}h | OT:{" "}
                  {Number(item.otHours || 0)}h
                </Text>
              </View>
            ))
          ) : (
            <View className="items-center py-10">
              <TabBarIcon
                name="document-text-outline"
                color="#cbd5e1"
                size={34}
              />
              <Text className="mt-2 text-[13px] text-slate-400">
                No records found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
