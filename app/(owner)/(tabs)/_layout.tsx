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
      width: focused ? 48 : 40,
      height: focused ? 48 : 40,
      backgroundColor: focused ? "#eef2ff" : "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
    }}
  >
    <TabBarIcon
      name={name}
      color={focused ? "#4f46e5" : "#94a3b8"}
      size={focused ? 24 : 22}
    />
    {focused && (
      <View
        style={{
          position: "absolute",
          bottom: -4,
          width: 4,
          height: 4,
          backgroundColor: "#4f46e5",
          borderRadius: 2,
        }}
      />
    )}
  </View>
);

export default function OwnerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Platform.OS === "ios" ? 24 : 16,
          height: 72,
          borderRadius: 24,
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          height: 72,
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
        name="employees"
        options={{
          title: "Employees",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "people" : "people-outline"} />
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
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "document-text" : "document-text-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="salary"
        options={{
          title: "Salary",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "cash" : "cash-outline"} />
          ),
        }}
      />
    </Tabs>
  );
}

