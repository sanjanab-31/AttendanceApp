import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";
import { StatusBar } from "expo-status-bar";

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
  const router = useRouter();
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
    <SafeAreaView edges={["top"]}>
      <StatusBar style="dark" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 }}>
         <TouchableOpacity 
            onPress={() => router.back()}
            style={{ width: 40, height: 40, backgroundColor: "white", borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e8f0", elevation: 2 }}
         >
            <TabBarIcon name="arrow-back" color="#0f172a" size={20} />
         </TouchableOpacity>
         <View style={{ marginLeft: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>Transaction History</Text>
            <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500", marginTop: 2 }}>View all salary payouts</Text>
         </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ marginBottom: 24 }}>
            <View style={{ marginTop: 8, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", backgroundColor: "white", padding: 20, elevation: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
                <TabBarIcon name="search" color="#94a3b8" size={20} />
                <TextInput
                  style={{ marginLeft: 12, flex: 1, fontSize: 15, color: "#1e293b" }}
                  placeholder="Search by staff member..."
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <Text style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 12, marginLeft: 4 }}>
                Filter by Member
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {employeeChips.map((chip: any) => {
                  const label = chip === "all" ? "Everyone" : String(chip);
                  const active = selectedEmployee === chip;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => setSelectedEmployee(chip)}
                      style={[
                        { marginRight: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
                        active ? { backgroundColor: "#4f46e5", borderColor: "#4f46e5", elevation: 2 } : { backgroundColor: "white", borderColor: "#e2e8f0" }
                      ]}
                    >
                      <Text
                        style={{ fontSize: 12, fontWeight: "bold", color: active ? "white" : "#475569" }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                {rows.length} {rows.length === 1 ? 'Record' : 'Records'}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                 <TabBarIcon name="filter" color="#94a3b8" size={14} />
                 <Text style={{ fontSize: 12, fontWeight: "500", color: "#64748b", marginLeft: 4 }}>Latest first</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const periodLabel = `${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`;
          const paidDate = formatDate(item.paymentDate);
          const status = String(item.paymentStatus || "unpaid").toLowerCase();
          const isPaid = status === "paid";

          return (
            <View style={{ marginBottom: 16, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", backgroundColor: "white", padding: 20, elevation: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                 <Text style={{ fontSize: 16, fontWeight: "900", color: "#0f172a" }}>
                   {item.employeeName || "Member"}
                 </Text>
                 <View style={[{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1 }, isPaid ? { backgroundColor: "#ecfdf5", borderColor: "#d1fae5" } : { backgroundColor: "#fffbeb", borderColor: "#fef3c7" }]}>
                   <Text style={[{ fontSize: 10, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.5 }, isPaid ? { color: "#059669" } : { color: "#d97706" }]}>
                     {isPaid ? "Settled" : "Unpaid"}
                   </Text>
                 </View>
              </View>

              <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, marginHorizontal: -4, paddingHorizontal: 4, paddingBottom: 12, borderBottomColor: "#f8fafc" }}>
                 <View>
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Period</Text>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155" }}>
                      {periodLabel}
                    </Text>
                 </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
        }}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: "center", borderRadius: 24, borderStyle: "dashed", borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", paddingHorizontal: 24, paddingVertical: 48 }}>
            <View style={{ backgroundColor: "white", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 16, elevation: 1 }}>
               <TabBarIcon name="receipt-outline" color="#94a3b8" size={28} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#334155" }}>
              No Transactions Found
            </Text>
            <Text style={{ marginTop: 4, textAlign: "center", fontSize: 13, color: "#64748b", fontWeight: "500" }}>
              Try adjusting your filters or search term.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

