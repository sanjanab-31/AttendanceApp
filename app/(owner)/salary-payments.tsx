import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function SalaryPaymentsScreen() {
  const { salaryPayments } = useData();
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const employeeChips = useMemo(() => {
    const names = Array.from(
      new Set(
        salaryPayments.map((row: any) => row.employeeName).filter(Boolean),
      ),
    ).sort((left: any, right: any) =>
      String(left).localeCompare(String(right)),
    );

    return ["all", ...names];
  }, [salaryPayments]);

  const rows = useMemo(() => {
    return [...salaryPayments]
      .filter((row: any) => {
        const employeeName = String(row.employeeName || "");
        const matchSearch = employeeName
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchEmployee =
          selectedEmployee === "all" || employeeName === selectedEmployee;

        return matchSearch && matchEmployee;
      })
      .sort((left: any, right: any) => {
        const leftTs = parseDate(left.paymentDate)?.getTime() || 0;
        const rightTs = parseDate(right.paymentDate)?.getTime() || 0;
        return rightTs - leftTs;
      });
  }, [salaryPayments, search, selectedEmployee]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-slate-50">
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-[24px] font-bold text-slate-900">
              Salary Payments
            </Text>

            <View className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <TabBarIcon name="search" color="#94a3b8" size={18} />
                <TextInput
                  className="ml-2 flex-1 text-[14px] text-slate-800"
                  placeholder="Search by employee name"
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <Text className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Employee Filter
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {employeeChips.map((chip: any) => {
                  const label = chip === "all" ? "All Employees" : String(chip);
                  const active = selectedEmployee === chip;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setSelectedEmployee(chip)}
                      className={`mr-2 rounded-full border px-4 py-2.5 ${active ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"}`}
                    >
                      <Text
                        className={`text-[13px] font-semibold ${active ? "text-white" : "text-slate-700"}`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mt-3 flex-row items-center justify-between px-1">
              <Text className="text-[14px] font-semibold text-slate-700">
                {rows.length} records
              </Text>
              <Text className="text-[12px] text-slate-500">Latest first</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const periodLabel = `${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`;
          const paidDate = formatDate(item.paymentDate);
          const status = String(item.paymentStatus || "unpaid").toLowerCase();

          return (
            <View className="mb-3 rounded-3xl border border-slate-200 bg-white p-4">
              <Text className="text-[17px] font-semibold text-slate-900">
                {item.employeeName || "Employee"}
              </Text>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[13px] text-slate-500">Period</Text>
                <Text className="text-[14px] font-semibold text-slate-700">
                  {periodLabel}
                </Text>
              </View>

              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[13px] text-slate-500">Amount</Text>
                <Text className="text-[15px] font-semibold text-emerald-700">
                  {formatCurrency(
                    Number(item.paidAmount ?? item.totalSalary ?? 0),
                  )}
                </Text>
              </View>

              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[13px] text-slate-500">Paid on</Text>
                <Text className="text-[14px] text-slate-700">{paidDate}</Text>
              </View>

              <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                <View className="flex-row items-center">
                  <TabBarIcon
                    name={
                      status === "paid"
                        ? "checkmark-circle-outline"
                        : "alert-circle-outline"
                    }
                    color={status === "paid" ? "#059669" : "#ea580c"}
                    size={16}
                  />
                  <Text className="ml-1 text-[12px] text-slate-500">
                    Payment Status
                  </Text>
                </View>
                <Text
                  className={`text-[13px] font-semibold ${status === "paid" ? "text-emerald-700" : "text-orange-700"}`}
                >
                  {status === "paid" ? "Paid" : "Unpaid"}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="mt-6 items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10">
            <TabBarIcon name="receipt-outline" color="#cbd5e1" size={44} />
            <Text className="mt-2 text-[15px] font-semibold text-slate-700">
              No salary payment records yet
            </Text>
            <Text className="mt-1 text-center text-[13px] text-slate-500">
              Try another employee or search term.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
