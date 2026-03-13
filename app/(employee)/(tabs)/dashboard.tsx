import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React from "react";
import {
    ScrollView,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const StatCard = ({ title, value, icon, tint }: any) => (
    <View className="w-[48%] bg-white rounded-2xl p-4 border border-blue-100 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-500 text-[11px] font-semibold uppercase">
          {title}
        </Text>
        <View
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: tint }}
        >
          <TabBarIcon name={icon} color="#0f172a" size={18} />
        </View>
      </View>
      <Text className="text-blue-950 text-xl font-extrabold">{value}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-blue-50">
      <ScrollView className="px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-3xl p-5 border border-blue-100 mb-4">
          <Text className="text-blue-500 text-xs">EMPLOYEE PORTAL</Text>
          <Text className="text-2xl font-extrabold text-blue-950 mt-1">
            {userData?.name || "Employee"}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-blue-700 font-semibold">
              {userData?.employeeId || "N/A"}
            </Text>
            <Text className="text-gray-500 text-xs">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between mb-2">
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

        <View className="bg-white rounded-3xl p-4 border border-blue-100 mb-24">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-blue-950 text-base font-bold">
              Recent Attendance
            </Text>
            <Text className="text-gray-500 text-xs">
              Last {monthAttendance.length} entries
            </Text>
          </View>

          {monthAttendance.length > 0 ? (
            monthAttendance.map((item: any) => (
              <View
                key={item.id}
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
              >
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-gray-900 text-sm">
                    {item.date?.toDate
                      ? item.date
                          .toDate()
                          .toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                      : "N/A"}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {item.shiftHours || 0}h Shift + {item.otHours || 0}h OT
                  </Text>
                </View>
                <Text className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(item.totalSalary || 0)}
                </Text>
              </View>
            ))
          ) : (
            <View className="py-8 items-center">
              <TabBarIcon name="calendar-outline" color="#9ca3af" size={24} />
              <Text className="text-gray-400 mt-2">
                No attendance records yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
