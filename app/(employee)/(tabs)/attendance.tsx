import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";

export default function MyAttendance() {
  const { attendance } = useData();

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ backgroundColor: "white", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9", elevation: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b" }}>
            {item.date
              ?.toDate()
              .toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Status: Present</Text>
        </View>
        <View style={{ backgroundColor: "#f0fdf4", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
          <Text style={{ color: "#15803d", fontWeight: "bold", fontSize: 12 }}>
            {formatCurrency(item.totalSalary)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", backgroundColor: "#f8fafc", padding: 12, borderRadius: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
            Shift
          </Text>
          <Text style={{ color: "#334155", fontWeight: "bold" }}>{item.shiftHours} hrs</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
            OT
          </Text>
          <Text style={{ color: "#334155", fontWeight: "bold" }}>{item.otHours} hrs</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
            Total
          </Text>
          <Text style={{ color: "#334155", fontWeight: "bold" }}>
            {item.shiftHours + item.otHours} hrs
          </Text>
        </View>
      </View>

      {item.remarks ? (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontStyle: "italic" }}>
            Notes: {item.remarks}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 24, flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 24 }}>
          Attendance History
        </Text>

        <FlatList
          data={attendance}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}>
              <TabBarIcon name="calendar-outline" color="#d1d5db" size={80} />
              <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 18 }}>
                No records found
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

