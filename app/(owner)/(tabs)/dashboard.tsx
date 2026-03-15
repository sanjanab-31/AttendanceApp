import { useAuth } from "@/src/context/AuthContext";
import { useData } from "@/src/context/DataContext";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
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

// Circular Stat Component (Just the circle and label, no box)
const CircularStat = ({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string | number;
  percentage: number;
  color: string;
}) => (
  <View
    style={{
      alignItems: "center",
      flex: 1,
      marginHorizontal: 4,
    }}
  >
    <View
      style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundColor: "white",
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 4,
          borderColor: color,
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
          transform: [{ rotate: `${(percentage / 100) * 360 - 45}deg` }],
        }}
      />
      <Text style={{ fontSize: 20, fontWeight: "900", color: "#1e293b" }}>
        {value}
      </Text>
    </View>
    <Text
      style={{
        marginTop: 12,
        fontSize: 12,
        fontWeight: "800",
        color: "#64748b",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 0.8,
      }}
    >
      {label}
    </Text>
  </View>
);

const QuickActionCard = ({
  title,
  icon,
  onPress,
  bg,
  iconColor,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  bg: string;
  iconColor: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      width: "48%",
      backgroundColor: "white",
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#f1f5f9",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    }}
  >
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
      }}
    >
      <TabBarIcon name={icon as any} color={iconColor} size={26} />
    </View>
    <Text
      style={{
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        textAlign: "center",
      }}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function OwnerDashboard() {
  const { userData } = useAuth();
  const { employees, attendance } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const totalEmployees = employees.length;
  const today = toDateKey(new Date());
  const todayRecords = attendance.filter(
    (rec) => getRecordDateKey(rec.date) === today,
  );

  const presentToday = new Set(
    todayRecords.map((rec) => rec.employeeId || rec.employeeName),
  ).size;
  const absentToday = Math.max(totalEmployees - presentToday, 0);

  const filteredEmployees = searchQuery.trim() 
    ? employees.filter(emp => 
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      
      {/* Refined Header */}
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: "900", color: "#0f172a" }}>
              Good Morning, {userData?.name?.split(' ')[0] || "Admin"} 👋
            </Text>
            <Text style={{ fontSize: 16, color: "#64748b", marginTop: 4 }}>
              Here's what's happening today.
            </Text>
          </View>
          <TouchableOpacity>
            <Image 
              source={{ uri: "https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff" }} 
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
          </TouchableOpacity>
        </View>

        {/* Functional Search Bar */}
        <View style={{ position: "relative", zIndex: 10 }}>
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
            <TabBarIcon name="search-outline" color="#94a3b8" size={20} />
            <TextInput 
              placeholder="Search employee..." 
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginLeft: 12, fontSize: 16, color: "#0f172a", flex: 1 }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <TabBarIcon name="close-circle" color="#cbd5e1" size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {filteredEmployees.length > 0 && (
            <View style={{ position: "absolute", top: 70, left: 0, right: 0, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, overflow: "hidden" }}>
              {filteredEmployees.map((emp, idx) => (
                <TouchableOpacity 
                  key={emp.id}
                  style={{ padding: 16, borderBottomWidth: idx === filteredEmployees.length - 1 ? 0 : 1, borderBottomColor: "#f1f5f9", flexDirection: "row", alignItems: "center" }}
                  onPress={() => {
                    setSearchQuery("");
                    router.push("/(owner)/(tabs)/employees"); 
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    <Text style={{ fontWeight: "bold", color: "#64748b" }}>{emp.name?.[0]}</Text>
                  </View>
                  <View>
                    <Text style={{ fontWeight: "700", color: "#1e293b" }}>{emp.name}</Text>
                    <Text style={{ fontSize: 12, color: "#94a3b8" }}>{emp.employeeId}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section with Independent Circles (No Boxes) */}
        <View style={{ paddingHorizontal: 16, marginTop: 24, flexDirection: "row", justifyContent: "space-between" }}>
          <CircularStat 
            label="Total" 
            value={totalEmployees > 9 ? totalEmployees : `0${totalEmployees}`} 
            percentage={100} 
            color="#4f46e5" 
          />
          <CircularStat 
            label="Present" 
            value={presentToday > 9 ? presentToday : `0${presentToday}`} 
            percentage={totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0} 
            color="#10b981" 
          />
          <CircularStat 
            label="Absent" 
            value={absentToday > 9 ? absentToday : `0${absentToday}`} 
            percentage={totalEmployees > 0 ? (absentToday / totalEmployees) * 100 : 0} 
            color="#ef4444" 
          />
        </View>

        {/* Updated Quick Actions List */}
        <View style={{ paddingHorizontal: 24, marginTop: 48 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a", marginBottom: 20 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            <QuickActionCard 
              title="Add Employee" 
              icon="person-add" 
              onPress={() => router.push("/(owner)/add-employee")}
              bg="#eff6ff"
              iconColor="#2563eb"
            />
            <QuickActionCard 
              title="Mark Attendance" 
              icon="calendar" 
              onPress={() => router.push("/(owner)/mark-attendance")}
              bg="#ecfdf5"
              iconColor="#059669"
            />
            <QuickActionCard 
              title="Reports" 
              icon="document-text" 
              onPress={() => router.push("/(owner)/(tabs)/reports")}
              bg="#fff7ed"
              iconColor="#ea580c"
            />
            <QuickActionCard 
              title="Salary Mark" 
              icon="cash" 
              onPress={() => router.push("/(owner)/(tabs)/salary")}
              bg="#fef2f2"
              iconColor="#dc2626"
            />
          </View>
        </View>
      </ScrollView>

      {/* Spacing for Tab Bar */}
      {/* <View style={{ height: 80 }} /> */}
    </View>
  );
}
