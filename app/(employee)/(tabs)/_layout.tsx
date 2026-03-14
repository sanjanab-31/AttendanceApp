import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Tabs } from "expo-router";
import React from "react";
import { View, Platform } from "react-native";

const TabIcon = ({
  focused,
  name,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof TabBarIcon>["name"];
}) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <TabBarIcon
      name={name}
      color={focused ? "#4f46e5" : "#94a3b8"}
      size={26}
    />
  </View>
);

export default function EmployeeTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 70,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          elevation: 16,
          shadowColor: "#0f172a",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "grid" : "grid-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "calendar" : "calendar-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="salary"
        options={{
          title: "Salary",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "card" : "card-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="bonus"
        options={{
          title: "Bonus",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "gift" : "gift-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "person" : "person-outline"} />
          ),
        }}
      />
    </Tabs>
  );
}
