import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRecordDateKey = (value: any) => {
  const recordDate = value?.toDate?.() || value;
  const parsedDate = new Date(recordDate);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return toDateKey(parsedDate);
};

export default function OwnerDashboard() {
  const { userData, logout } = useAuth();
  const { employees, attendance } = useData();
  const router = useRouter();

  const totalEmployees = employees.length;
  const today = toDateKey(new Date());
  const todayRecords = attendance.filter(
    (rec) => getRecordDateKey(rec.date) === today,
  );
  const todayAttendanceRecords = todayRecords.length;

  const presentToday = new Set(
    todayRecords.map((rec) => rec.employeeId || rec.employeeName),
  ).size;
  const pendingAttendance = Math.max(totalEmployees - presentToday, 0);

  const recentAttendance = attendance.slice(0, 3);

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
    <View className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: tint }}
        >
          <TabBarIcon name={icon as any} color="#0f172a" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </Text>
          <Text className="mt-1 text-[22px] font-bold text-slate-900">
            {value}
          </Text>
        </View>
      </View>
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
      className="mb-3 w-[31%] items-center rounded-2xl border border-slate-200 bg-white px-2 py-4"
    >
      <View className="mb-2 h-11 w-11 items-center justify-center rounded-xl bg-blue-700">
        <TabBarIcon name={icon as any} color="#ffffff" size={18} />
      </View>
      <Text className="text-center text-[12px] font-semibold text-slate-700">
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-slate-50">
      <ScrollView className="px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-4 rounded-3xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[12px] font-semibold uppercase tracking-wide text-blue-600">
                Owner Panel
              </Text>
              <Text className="mt-1 text-[24px] font-bold text-slate-900">
                {userData?.name || "Owner"}
              </Text>
              <Text className="mt-1 text-[13px] text-slate-500">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={logout}
              className="h-11 w-11 items-center justify-center rounded-xl bg-red-50"
            >
              <TabBarIcon name="log-out-outline" color="#ef4444" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-3 flex-row flex-wrap justify-between">
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
            tint="#d1fae5"
          />
          <StatCard
            title="Pending Attendance"
            value={pendingAttendance}
            icon="alert-circle"
            tint="#fde68a"
          />
          <StatCard
            title="Attendance Records"
            value={todayAttendanceRecords}
            icon="clipboard"
            tint="#ddd6fe"
          />
        </View>

        <View className="mb-4 rounded-3xl border border-slate-200 bg-white p-4">
          <Text className="mb-3 text-[17px] font-semibold text-slate-900">
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

        <View className="mb-24 rounded-3xl border border-slate-200 bg-white p-4">
          <Text className="mb-3 text-[17px] font-semibold text-slate-900">
            Recent Attendance
          </Text>

          {recentAttendance.length > 0 ? (
            recentAttendance.map((item: any) => (
              <View key={item.id} className="border-b border-slate-100 py-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[15px] font-semibold text-slate-900">
                      {item.employeeName || "Employee"}
                    </Text>
                    <Text className="mt-1 text-[13px] text-slate-500">
                      {item.date?.toDate
                        ? item.date.toDate().toLocaleDateString("en-IN")
                        : "N/A"}
                    </Text>
                  </View>
                  <Text className="text-[14px] font-semibold text-emerald-600">
                    {formatCurrency(item.totalSalary || 0)}
                  </Text>
                </View>

                <Text className="mt-2 text-[13px] text-slate-600">
                  Shift: {item.shiftHours || 0}h | OT: {item.otHours || 0}h
                </Text>
              </View>
            ))
          ) : (
            <View className="items-center py-8">
              <Text className="text-[13px] text-slate-400">
                No attendance records yet
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push("/(owner)/(tabs)/attendance")}
            className="mt-4 items-center rounded-2xl border border-blue-200 bg-blue-50 py-3"
          >
            <Text className="text-[14px] font-semibold text-blue-700">
              View All
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
