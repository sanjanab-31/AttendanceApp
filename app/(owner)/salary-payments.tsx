import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 10,
  },
  employeeName: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  label: { color: "#64748b", fontSize: 13 },
  value: { color: "#1e293b", fontWeight: "600", fontSize: 13 },
  amount: { color: "#047857", fontWeight: "700", fontSize: 14 },
  paid: { color: "#059669", fontWeight: "700" },
  unpaid: { color: "#ea580c", fontWeight: "700" },
  emptyWrap: { marginTop: 80, alignItems: "center" },
  emptyText: { marginTop: 10, color: "#94a3b8" },
});

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

  const rows = [...salaryPayments].sort((a: any, b: any) => {
    const left = parseDate(a.paymentDate)?.getTime() || 0;
    const right = parseDate(b.paymentDate)?.getTime() || 0;
    return right - left;
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const periodLabel = `${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`;
          const paidDate = formatDate(item.paymentDate);
          const status = (item.paymentStatus || "unpaid").toLowerCase();

          return (
            <View style={styles.card}>
              <Text style={styles.employeeName}>
                {item.employeeName || "Employee"}
              </Text>

              <View style={styles.row}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TabBarIcon
                    name="calendar-outline"
                    color="#64748b"
                    size={15}
                  />
                  <Text style={[styles.label, { marginLeft: 4 }]}>Period</Text>
                </View>
                <Text style={styles.value}>{periodLabel}</Text>
              </View>

              <View style={styles.row}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TabBarIcon name="cash-outline" color="#64748b" size={15} />
                  <Text style={[styles.label, { marginLeft: 4 }]}>
                    Amount
                  </Text>
                </View>
                <Text style={styles.amount}>
                  {formatCurrency(Number(item.paidAmount ?? item.totalSalary ?? 0))}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Paid on</Text>
                <Text style={styles.value}>{paidDate}</Text>
              </View>

              <View style={styles.row}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TabBarIcon
                    name={
                      status === "paid"
                        ? "checkmark-circle-outline"
                        : "alert-circle-outline"
                    }
                    color={status === "paid" ? "#059669" : "#ea580c"}
                    size={15}
                  />
                  <Text style={[styles.label, { marginLeft: 4 }]}>
                    Payment Status
                  </Text>
                </View>
                <Text style={status === "paid" ? styles.paid : styles.unpaid}>
                  {status === "paid" ? "Paid" : "Unpaid"}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <TabBarIcon name="receipt-outline" color="#cbd5e1" size={48} />
            <Text style={styles.emptyText}>No salary payment records yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
