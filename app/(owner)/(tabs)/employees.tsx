import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { formatCurrency } from "@/src/utils/salary";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const AVATAR_COLORS = [
  { bg: "#eef2ff", text: "#4f46e5" },
  { bg: "#ecfdf5", text: "#059669" },
  { bg: "#fff7ed", text: "#ea580c" },
  { bg: "#fdf2f8", text: "#a21caf" },
  { bg: "#eff6ff", text: "#2563eb" },
];

function getAvatarColor(name: string) {
  const index =
    name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function EmployeeManagement() {
  const { employees, deleteEmployee } = useData();
  const router = useRouter();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      showToast("Employee deleted successfully!", "success");
      setDeleteTarget(null);
    } catch (error: any) {
      showToast(error?.message || "Unable to delete employee.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = search.trim()
    ? employees.filter(
        (emp: any) =>
          emp.name?.toLowerCase().includes(search.toLowerCase()) ||
          emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
          emp.email?.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const renderEmployee = ({ item, index }: { item: any; index: number }) => {
    const avatar = getAvatarColor(item.name || "U");
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/(owner)/employee/${item.id}`)}
        style={{
          backgroundColor: "white",
          borderRadius: 20,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#f1f5f9",
          overflow: "hidden",
          elevation: 2,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        }}
      >
        {/* Card Top Row */}
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
          {/* Avatar */}
          <View
            style={{
              height: 52,
              width: 52,
              borderRadius: 14,
              backgroundColor: avatar.bg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              flexShrink: 0,
            }}
          >
            <Text style={{ color: avatar.text, fontWeight: "900", fontSize: 22 }}>
              {item.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}
            >
              {item.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: "#94a3b8", fontSize: 12, fontWeight: "500", marginTop: 2 }}
            >
              {item.email}
            </Text>
          </View>

          {/* Rate badge */}
          <View
            style={{
              backgroundColor: "#ecfdf5",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            <Text style={{ color: "#059669", fontSize: 12, fontWeight: "700" }}>
              {formatCurrency(item.hourlyRate)}/hr
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#f8fafc", marginHorizontal: 16 }} />

        {/* Card Bottom Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          {/* Employee ID chip */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#f1f5f9",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <TabBarIcon name="id-card-outline" color="#64748b" size={13} />
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", marginLeft: 5 }}>
              {item.employeeId}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push(`/(owner)/employee/${item.id}`)}
              style={{
                backgroundColor: "#f0fdf4",
                height: 36,
                width: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
              }}
            >
              <TabBarIcon name="eye-outline" color="#16a34a" size={17} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(owner)/edit-employee",
                  params: { id: item.id },
                })
              }
              style={{
                backgroundColor: "#eef2ff",
                height: 36,
                width: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
              }}
            >
              <TabBarIcon name="pencil-outline" color="#4f46e5" size={17} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.name)}
              style={{
                backgroundColor: "#fff1f2",
                height: 36,
                width: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
              }}
            >
              <TabBarIcon name="trash-outline" color="#ef4444" size={17} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#0f172a" }}>
              Staff List
            </Text>
            <Text style={{ color: "#94a3b8", fontWeight: "500", fontSize: 13, marginTop: 3 }}>
              {filteredEmployees.length} of {employees.length} members
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(owner)/add-employee")}
            style={{
              backgroundColor: "#4f46e5",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 14,
              elevation: 4,
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <TabBarIcon name="add" color="white" size={18} />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13, marginLeft: 4 }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <TabBarIcon name="search-outline" color="#94a3b8" size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, ID, or email..."
            placeholderTextColor="#cbd5e1"
            style={{ flex: 1, marginLeft: 10, fontSize: 14, color: "#0f172a", fontWeight: "500" }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <TabBarIcon name="close-circle" color="#cbd5e1" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 80,
              backgroundColor: "white",
              borderRadius: 24,
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <View style={{ backgroundColor: "#f8fafc", width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <TabBarIcon name="people-outline" color="#cbd5e1" size={36} />
            </View>
            <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "700" }}>
              {search ? "No results found" : "No employees yet"}
            </Text>
            <Text style={{ color: "#94a3b8", marginTop: 6, fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
              {search
                ? `Nothing matched "${search}". Try a different search.`
                : "Add your first staff member to get started."}
            </Text>
            {!search && (
              <TouchableOpacity
                onPress={() => router.push("/(owner)/add-employee")}
                style={{ marginTop: 20, backgroundColor: "#4f46e5", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, elevation: 2 }}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Add First Member</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Remove Employee?"
        message={`This will permanently remove ${deleteTarget?.name} from your system records. This action cannot be reversed.`}
        confirmText="Yes, Delete"
        variant="delete"
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </View>
  );
}
