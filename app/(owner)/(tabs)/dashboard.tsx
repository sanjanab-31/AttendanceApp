import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const toDateKey = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const getRecordDateKey = (date: any) => {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return toDateKey(d);
};

const StatCard = ({
  title,
  value,
  icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
}) => (
  <View style={{ marginBottom: 16, width: "47%", borderRadius: 24, backgroundColor: "white", padding: 20, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2 }}>
    <View
      className={`h-12 w-12 items-center justify-center rounded-2xl mb-4 ${bg}`}
    >
      <TabBarIcon name={icon as any} color={color} size={22} />
    </View>
    <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
      {title}
    </Text>
    <Text className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">
      {value}
    </Text>
  </View>
);

const QuickAction = ({
  title,
  icon,
  onPress,
  primary = false,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  primary?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 16,
      backgroundColor: primary ? "#4f46e5" : "white",
      borderWidth: 1,
      borderColor: primary ? "#4f46e5" : "#f1f5f9",
      elevation: 2,
      width: "100%",
    }}
  >
    <View className={`h-10 w-10 items-center justify-center rounded-xl mr-4 ${primary ? "bg-indigo-500" : "bg-slate-50"}`}>
      <TabBarIcon name={icon as any} color={primary ? "white" : "#4f46e5"} size={20} />
    </View>
    <Text className={`text-[15px] font-bold flex-1 ${primary ? "text-white" : "text-slate-800"}`}>
      {title}
    </Text>
    <TabBarIcon name="chevron-forward" color={primary ? "rgba(255,255,255,0.6)" : "#cbd5e1"} size={16} />
  </TouchableOpacity>
);

export default function OwnerDashboard() {
  const { userData, logout } = useAuth();
  const { employees, attendance } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalEmployees = employees.length;
  const today = toDateKey(new Date());
  const todayRecords = attendance.filter(
    (rec) => getRecordDateKey(rec.date) === today,
  );
  
  const presentToday = new Set(
    todayRecords.map((rec) => rec.employeeId || rec.employeeName),
  ).size;
  const pendingAttendance = Math.max(totalEmployees - presentToday, 0);
  const recentAttendance = attendance.slice(0, 5);

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#f8fafc" }}>
      <StatusBar style="dark" />
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
        <View className="px-6 py-6 pb-2">
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mb-1">
                Workspace Admin
              </Text>
              <Text className="text-3xl font-extrabold text-slate-900 leading-tight">
                Hello, {userData?.name?.split(' ')[0] || "Owner"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={logout}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-100"
              style={{ elevation: 2 }}
            >
              <TabBarIcon name="log-out-outline" color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>

          {/* Date pill */}
          <View className="bg-indigo-50 self-start px-4 py-1.5 rounded-full border border-indigo-100 mb-6">
            <Text className="text-indigo-700 font-bold text-[13px]">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between px-6 mb-4">
          <StatCard
            title="Total Staff"
            value={totalEmployees}
            icon="people"
            color="#4f46e5"
            bg="bg-indigo-50"
          />
          <StatCard
            title="Today Present"
            value={presentToday}
            icon="checkmark-circle"
            color="#10b981"
            bg="bg-emerald-50"
          />
          <StatCard
            title="Absent/Pending"
            value={pendingAttendance}
            icon="alert-circle"
            color="#f59e0b"
            bg="bg-amber-50"
          />
          <StatCard
            title="Active Records"
            value={todayRecords.length}
            icon="clipboard"
            color="#ec4899"
            bg="bg-pink-50"
          />
        </View>

        {/* Quick Actions Grid */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4 mt-2">
            <Text className="text-[18px] font-extrabold text-slate-900">
              Operations
            </Text>
          </View>
          <View>
             <QuickAction
              title="Mark Daily Attendance"
              icon="calendar"
              onPress={() => router.push("/(owner)/mark-attendance")}
              primary={true}
            />
            <View className="flex-row justify-between mb-3 mt-3">
              <TouchableOpacity
                onPress={() => router.push("/(owner)/add-employee")}
                className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 items-center justify-center"
                style={{ elevation: 2 }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-2">
                  <TabBarIcon name="person-add" color="#3b82f6" size={20} />
                </View>
                <Text className="text-slate-800 font-bold text-[13px]">Add Member</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(owner)/bonus-management")}
                className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 items-center justify-center"
                style={{ elevation: 2 }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50 mb-2">
                  <TabBarIcon name="gift" color="#f43f5e" size={20} />
                </View>
                <Text className="text-slate-800 font-bold text-[13px]">Bonus & Deduct</Text>
              </TouchableOpacity>
            </View>
            <View className="mt-3">
              <QuickAction
                title="System Reports"
                icon="stats-chart"
                onPress={() => router.push("/(owner)/(tabs)/reports")}
              />
            </View>
          </View>
        </View>

        {/* Recent Attendance */}
        <View className="px-6 pb-32">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-[18px] font-extrabold text-slate-900">
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push("/(owner)/(tabs)/attendance")}>
              <Text className="text-indigo-600 font-bold text-[14px]">See all</Text>
            </TouchableOpacity>
          </View>

          {recentAttendance.length > 0 ? (
            <View className="bg-white rounded-3xl border border-slate-100 p-2" style={{ elevation: 1 }}>
              {recentAttendance.map((item: any, index) => (
                <View 
                  key={item.id} 
                  className={`flex-row items-center p-4 ${
                    index !== recentAttendance.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <View className="h-11 w-11 rounded-full bg-slate-100 items-center justify-center mr-4">
                    <Text className="text-slate-600 font-bold text-lg">
                      {item.employeeName?.charAt(0) || "E"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-slate-900">
                      {item.employeeName || "Employee"}
                    </Text>
                    <Text className="text-[12px] text-slate-500 mt-0.5">
                      {item.date?.toDate
                        ? item.date.toDate().toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Today"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[15px] font-bold text-emerald-600">
                      {formatCurrency(item.totalSalary || 0)}
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5 italic">
                      {item.shiftHours}h Shift
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-12 bg-white rounded-3xl border border-slate-100 border-dashed">
              <TabBarIcon name="receipt-outline" color="#cbd5e1" size={40} />
              <Text className="mt-2 text-slate-400 font-medium">
                Waiting for today's logs
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
