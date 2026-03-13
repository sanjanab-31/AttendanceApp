import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function EmployeeTabLayout() {
  const renderIcon = (
    focused: boolean,
    color: string,
    name:
      | "home"
      | "home-outline"
      | "calendar"
      | "calendar-outline"
      | "cash"
      | "cash-outline"
      | "gift"
      | "gift-outline"
      | "person"
      | "person-outline",
  ) => (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "#1d4ed8" : "transparent",
      }}
    >
      <TabBarIcon name={name} color={focused ? "#ffffff" : color} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#334155",
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 72,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: "#eaf2ff",
          borderTopWidth: 1,
          borderTopColor: "#bfdbfe",
          elevation: 12,
          shadowColor: "#1e3a8a",
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
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
          tabBarIcon: ({ color, focused }) =>
            renderIcon(focused, color, focused ? "home" : "home-outline"),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, focused }) =>
            renderIcon(
              focused,
              color,
              focused ? "calendar" : "calendar-outline",
            ),
        }}
      />
      <Tabs.Screen
        name="salary"
        options={{
          title: "Salary",
          tabBarIcon: ({ color, focused }) =>
            renderIcon(focused, color, focused ? "cash" : "cash-outline"),
        }}
      />
      <Tabs.Screen
        name="bonus"
        options={{
          title: "Bonus",
          tabBarIcon: ({ color, focused }) =>
            renderIcon(focused, color, focused ? "gift" : "gift-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) =>
            renderIcon(focused, color, focused ? "person" : "person-outline"),
        }}
      />
    </Tabs>
  );
}
