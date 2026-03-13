import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OwnerDashboard() {
  const { userData, logout } = useAuth();
  const { employees, attendance } = useData();
  const router = useRouter();

  const toDateKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getRecordDateKey = (value: any) => {
    const recordDate = value?.toDate?.() || value;
    const parsedDate = new Date(recordDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }
    return toDateKey(parsedDate);
  };

  const totalEmployees = employees.length;

  const today = toDateKey(new Date());
  const todayAttendanceRecords = attendance.filter(
    (rec) => getRecordDateKey(rec.date) === today,
  ).length;

  const presentToday = new Set(
    attendance
      .filter((rec) => getRecordDateKey(rec.date) === today)
      .map((rec) => rec.employeeId || rec.employeeName),
  ).size;

  const pendingAttendance = Math.max(totalEmployees - presentToday, 0);

  const recentAttendance = attendance.slice(0, 5);

  const StatCard = ({
    title,
    value,
    icon,
    tint,
  }: {
    title: string;
    value: string | number;
    icon: string;
    tint: string;
  }) => (
    <View className="w-[48%] bg-white rounded-2xl p-4 border border-blue-100 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-500 text-xs font-semibold uppercase">
          {title}
        </Text>
        <View
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: tint }}
        >
          <TabBarIcon name={icon as any} color="#0f172a" size={18} />
        </View>
      </View>
      <Text className="text-blue-950 text-xl font-extrabold">{value}</Text>
    </View>
  );

  const QuickAction = ({
    title,
    icon,
    route,
  }: {
    title: string;
    icon: string;
    route: string;
  }) => (
    <TouchableOpacity
      onPress={() => router.push(route as any)}
      className="w-[31%] bg-white border border-blue-100 rounded-2xl py-4 px-2 items-center mb-3"
    >
      <View className="w-11 h-11 rounded-xl items-center justify-center bg-blue-700 mb-2">
        <TabBarIcon name={icon as any} color="#ffffff" size={18} />
      </View>
      <Text className="text-gray-700 text-[11px] text-center font-semibold">
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-blue-50">
      <ScrollView className="px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-3xl p-5 border border-blue-100 mb-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-blue-500 text-xs">OWNER PANEL</Text>
              <Text className="text-2xl font-extrabold text-blue-950 mt-1">
                {userData?.name || "Owner"}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={logout}
              className="bg-red-50 w-11 h-11 rounded-xl items-center justify-center"
            >
              <TabBarIcon name="log-out-outline" color="#ef4444" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between mb-2">
          <StatCard
            title="Employees"
            value={totalEmployees}
            icon="people"
            tint="#bfdbfe"
          />
          <StatCard
            title="Today Present"
            value={presentToday}
            icon="checkmark-circle"
            tint="#dbeafe"
          />
          <StatCard
            title="Pending Attendance"
            value={pendingAttendance}
            icon="alert-circle"
            tint="#c7d2fe"
          />
          <StatCard
            title="Attendance Records"
            value={todayAttendanceRecords}
            icon="clipboard"
            tint="#dbeafe"
          />
        </View>

        <View className="bg-white rounded-3xl p-4 border border-blue-100 mb-4">
          <Text className="text-blue-950 text-base font-bold mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <QuickAction
              title="Add Employee"
              icon="person-add"
              route="/(owner)/add-employee"
            />
            <QuickAction
              title="Mark Attendance"
              icon="calendar"
              route="/(owner)/mark-attendance"
            />
            <QuickAction
              title="Bonus"
              icon="gift"
              route="/(owner)/bonus-management"
            />
            <QuickAction
              title="Reports"
              icon="stats-chart"
              route="/(owner)/(tabs)/reports"
            />
            <QuickAction
              title="History"
              icon="time"
              route="/(owner)/(tabs)/attendance"
            />
            <QuickAction
              title="Salary"
              icon="cash"
              route="/(owner)/(tabs)/salary"
            />
          </View>
        </View>

        <View className="bg-white rounded-3xl p-4 border border-blue-100 mb-24">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-blue-950 text-base font-bold">
              Recent Attendance
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(owner)/(tabs)/attendance")}
            >
              <Text className="text-blue-600 text-xs font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentAttendance.length > 0 ? (
            recentAttendance.map((item: any) => (
              <View key={item.id} className="py-3 border-b border-gray-100">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-gray-900 font-semibold text-sm">
                      {item.employeeName || "Employee"}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      {item.date?.toDate
                        ? item.date.toDate().toLocaleDateString("en-IN")
                        : "N/A"}
                    </Text>
                  </View>
                  <Text className="text-emerald-600 text-xs font-bold">
                    {formatCurrency(item.totalSalary || 0)}
                  </Text>
                </View>

                <View className="flex-row mt-3">
                  <View className="bg-blue-50 px-3 py-2 rounded-xl mr-2">
                    <Text className="text-[11px] text-blue-700 font-medium">
                      Shift: {item.shiftHours || 0}h
                    </Text>
                  </View>
                  <View className="bg-slate-100 px-3 py-2 rounded-xl mr-2">
                    <Text className="text-[11px] text-slate-600 font-medium">
                      OT: {item.otHours || 0}h
                    </Text>
                  </View>
                  <View className="bg-emerald-50 px-3 py-2 rounded-xl">
                    <Text className="text-[11px] text-emerald-700 font-medium">
                      Salary: {formatCurrency(item.totalSalary || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="py-8 items-center">
              <Text className="text-gray-400">No attendance records yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
