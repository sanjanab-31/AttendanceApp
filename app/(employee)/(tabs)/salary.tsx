import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";

const Row = ({ label, value, isBold = false, isGreen = false }: any) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
    <Text style={[{ color: "#4b5563" }, isBold ? { fontWeight: "bold" } : {}]}>
      {label}
    </Text>
    <Text
      style={[
        isBold ? { fontWeight: "bold", fontSize: 18 } : { fontWeight: "600" },
        isGreen ? { color: "#16a34a" } : { color: "#1e293b" }
      ]}
    >
      {value}
    </Text>
  </View>
);

export default function MySalary() {
  const { userData } = useAuth();
  const { attendance, bonuses } = useData();

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthAttendance = attendance.filter((rec) => {
    const d = rec.date?.toDate?.() || (rec.date ? new Date(rec.date) : null);
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const monthBonuses = bonuses.filter((b: any) => {
    const d = b.toDate?.toDate?.() || (b.toDate ? new Date(b.toDate) : null);
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const shiftSalary = monthAttendance.reduce(
    (acc: number, r: any) => acc + (r.shiftSalary || 0),
    0,
  );
  const otSalary = monthAttendance.reduce(
    (acc: number, r: any) => acc + (r.otSalary || 0),
    0,
  );
  const totalBonus = monthBonuses.reduce(
    (acc: number, b: any) => acc + (b.bonusAmount || 0),
    0,
  );
  const totalSalary = shiftSalary + otSalary + totalBonus;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView style={{ paddingHorizontal: 24, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 24 }}>
          Salary Breakdown
        </Text>
        <Text style={{ color: "#64748b", marginBottom: 24 }}>
          {new Date().toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <View style={{ backgroundColor: "white", padding: 24, borderRadius: 32, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 32, elevation: 2 }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Total Earnings
            </Text>
            <Text style={{ fontSize: 36, fontWeight: "900", color: "#16a34a" }}>
              {formatCurrency(totalSalary)}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 24 }} />

          <Row label="Shift Earnings" value={formatCurrency(shiftSalary)} />
          <Row label="OT Earnings" value={formatCurrency(otSalary)} />
          <Row label="Monthly Bonus" value={formatCurrency(totalBonus)} />

          <View style={{ height: 1, backgroundColor: "#f1f5f9", marginVertical: 16 }} />

          <Row
            label="Net Salary"
            value={formatCurrency(totalSalary)}
            isBold
            isGreen
          />
        </View>

        <View style={{ backgroundColor: "#f0fdf4", padding: 24, borderRadius: 32, borderWidth: 1, borderColor: "#dcfce7" }}>
          <Text style={{ color: "#166534", fontWeight: "bold", marginBottom: 8 }}>Salary Policy</Text>
          <Text style={{ color: "#16a34a", fontSize: 14, lineHeight: 20 }}>
            Your salary is calculated based on your hourly rate of{" "}
            {formatCurrency(userData?.hourlyRate || 0)}. Bonus is calculated
            separately based on total shift hours only.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

