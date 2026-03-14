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
      width: 48,
      height: 48,
      backgroundColor: focused ? "#eef2ff" : "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
    }}
  >
    <TabBarIcon
      name={name}
      color={focused ? "#4f46e5" : "#94a3b8"}
      size={24}
    />
  </View>
);

export default function EmployeeTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          height: Platform.OS === 'ios' ? 88 : 72,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          elevation: 16,
          shadowColor: "#0f172a",
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "home" : "home-outline"} />
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
            <TabIcon focused={focused} name={focused ? "wallet" : "wallet-outline"} />
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
