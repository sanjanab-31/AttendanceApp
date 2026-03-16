import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";

const StatCard = ({ title, value, icon, tint }: any) => (
  <View style={{ width: "48%", backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#dbeafe", marginBottom: 12, elevation: 2 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
        {title}
      </Text>
      <View
        style={{ width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: tint }}
      >
        <TabBarIcon name={icon} color="#0f172a" size={18} />
      </View>
    </View>
    <Text style={{ color: "#082f49", fontSize: 20, fontWeight: "900" }}>{value}</Text>
  </View>
);

export default function EmployeeDashboard() {
  const { userData } = useAuth();
  const { attendance, bonuses } = useData();

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthAttendance = attendance.slice(0, 6);

  const currentMonthStats = attendance.filter((rec) => {
    const d = rec.date?.toDate();
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalShiftHours = currentMonthStats.reduce(
    (acc: number, rec: any) => acc + (rec.shiftHours || 0),
    0,
  );
  const totalOTHours = currentMonthStats.reduce(
    (acc: number, rec: any) => acc + (rec.otHours || 0),
    0,
  );
  const totalSalary = currentMonthStats.reduce(
    (acc: number, rec: any) => acc + (rec.totalSalary || 0),
    0,
  );

  const totalBonus = bonuses
    .filter(
      (b) => b.toDate?.toDate && b.toDate.toDate().getMonth() === thisMonth,
    )
    .reduce((acc: number, b: any) => acc + (b.bonusAmount || 0), 0);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: "white", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#dbeafe", marginBottom: 16 }}>
          <Text style={{ color: "#3b82f6", fontSize: 12 }}>EMPLOYEE PORTAL</Text>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#082f49", marginTop: 4 }}>
            {userData?.name || "Employee"}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: "#1d4ed8", fontWeight: "600" }}>
              {userData?.employeeId || "N/A"}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 }}>
          <StatCard
            title="Shift Hours"
            value={totalShiftHours}
            icon="time"
            tint="#dbeafe"
          />
          <StatCard
            title="OT Hours"
            value={totalOTHours}
            icon="flash"
            tint="#bfdbfe"
          />
          <StatCard
            title="Earnings"
            value={formatCurrency(totalSalary)}
            icon="cash"
            tint="#c7d2fe"
          />
          <StatCard
            title="Bonus"
            value={formatCurrency(totalBonus)}
            icon="gift"
            tint="#dbeafe"
          />
        </View>

        <View style={{ backgroundColor: "white", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "#dbeafe", marginBottom: 96 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: "#082f49", fontSize: 16, fontWeight: "bold" }}>
              Recent Attendance
            </Text>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              Last {monthAttendance.length} entries
            </Text>
          </View>

          {monthAttendance.length > 0 ? (
            monthAttendance.map((item: any) => (
              <View
                key={item.id}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: "600", color: "#111827", fontSize: 14 }}>
                    {item.date?.toDate
                      ? item.date.toDate().toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "N/A"}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>
                    {item.shiftHours || 0}h Shift + {item.otHours || 0}h OT
                  </Text>
                </View>
                <Text style={{ fontWeight: "bold", color: "#059669", fontSize: 14 }}>
                  {formatCurrency(item.totalSalary || 0)}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <TabBarIcon name="calendar-outline" color="#9ca3af" size={24} />
              <Text style={{ color: "#9ca3af", marginTop: 8 }}>
                No attendance records yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

