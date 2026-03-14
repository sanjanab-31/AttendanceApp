import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useData } from "@/src/context/DataContext";
import { formatCurrency } from "@/src/utils/salary";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "@/components/ui/SafeAreaView";

export default function MyBonus() {
  const { bonuses } = useData();

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ backgroundColor: "white", padding: 24, borderRadius: 32, marginBottom: 16, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View style={{ backgroundColor: "#ffedd5", padding: 12, borderRadius: 100 }}>
          <TabBarIcon name="gift" color="#f97316" size={24} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: "900", color: "#ea580c" }}>
          {formatCurrency(item.bonusAmount)}
        </Text>
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Benefit Period
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: "#1e293b", fontWeight: "600" }}>{item.fromDate}</Text>
        <Text style={{ color: "#94a3b8", marginHorizontal: 8 }}>→</Text>
        <Text style={{ color: "#1e293b", fontWeight: "600" }}>{item.toDate}</Text>
      </View>

      <View style={{ backgroundColor: "#f8fafc", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#64748b", fontSize: 12 }}>Total Shift Hours</Text>
        <Text style={{ color: "#1e293b", fontWeight: "bold" }}>
          {item.totalShiftHours} hrs
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 24, flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 24 }}>
          My Bonuses
        </Text>

        <FlatList
          data={bonuses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}>
              <TabBarIcon name="gift-outline" color="#d1d5db" size={80} />
              <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 18 }}>
                No bonuses rewarded yet
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

