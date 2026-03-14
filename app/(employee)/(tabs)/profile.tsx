import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useAuth } from "@/src/context/AuthContext";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";

const InfoRow = ({ icon, label, value }: any) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
    <View style={{ width: 40, height: 40, backgroundColor: "#f1f5f9", borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
      <TabBarIcon name={icon} color="#64748b" size={20} />
    </View>
    <View>
      <Text style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 1 }}>
        {label}
      </Text>
      <Text style={{ color: "#1e293b", fontWeight: "600", fontSize: 16, marginTop: 2 }}>{value}</Text>
    </View>
  </View>
);

export default function MyProfile() {
  const { userData, logout } = useAuth();

  return (
    <SafeAreaView edges={["top"]}>
      <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", marginTop: 40, marginBottom: 40 }}>
          <View style={{ width: 96, height: 96, backgroundColor: "#dcfce7", borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b" }}>
            {userData?.name}
          </Text>
          <Text style={{ color: "#2563eb", fontWeight: "600", marginTop: 4 }}>
            Employee ID: {userData?.employeeId}
          </Text>
        </View>

        <View style={{ backgroundColor: "#f8fafc", padding: 24, borderRadius: 32, marginBottom: 32 }}>
          <InfoRow icon="call-outline" label="Phone" value={userData?.phone} />
          <InfoRow icon="mail-outline" label="Email" value={userData?.email} />
          <InfoRow
            icon="time-outline"
            label="Hourly Rate"
            value={`₹${userData?.hourlyRate}/hr`}
          />
          <InfoRow
            icon="calendar-outline"
            label="Joining Date"
            value={userData?.joiningDate}
          />
        </View>

        <TouchableOpacity
          onPress={logout}
          style={{ backgroundColor: "#fef2f2", padding: 20, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 40 }}
        >
          <TabBarIcon name="log-out-outline" color="#ef4444" size={24} />
          <Text style={{ color: "#ef4444", fontWeight: "bold", fontSize: 18, marginLeft: 8 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

