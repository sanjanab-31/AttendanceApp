import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { formatCurrency } from "@/src/utils/salary";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function EmployeeManagement() {
  const { employees, deleteEmployee } = useData();
  const router = useRouter();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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

  const renderEmployee = ({ item }: { item: any }) => (
    <View style={{ backgroundColor: "white", padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: "#f1f5f9", flexDirection: "row", alignItems: "center", elevation: 2 }}>
      <View style={{ height: 56, width: 56, borderRadius: 16, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
        <Text style={{ color: "#4f46e5", fontWeight: "900", fontSize: 20 }}>
          {item.name?.charAt(0) || "U"}
        </Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "bold", color: "#0f172a" }}>{item.name}</Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "500", marginTop: 2 }}>{item.email}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
          <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 }}>
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "bold" }}>
              ID: {item.employeeId}
            </Text>
          </View>
          <Text style={{ color: "#059669", fontSize: 13, fontWeight: "bold" }}>
            {formatCurrency(item.hourlyRate)}/hr
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(owner)/edit-employee",
              params: { id: item.id },
            })
          }
          style={{ backgroundColor: "#f8fafc", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, marginRight: 8 }}
        >
          <TabBarIcon name="pencil" color="#4f46e5" size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id, item.name)}
          style={{ backgroundColor: "#fff1f2", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 12 }}
        >
          <TabBarIcon name="trash" color="#ef4444" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <View>
            <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a" }}>
              Staff List
            </Text>
            <Text style={{ color: "#64748b", fontWeight: "500", fontSize: 14, marginTop: 4 }}>
              {employees.length} employees found
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(owner)/add-employee")}
            style={{ backgroundColor: "#4f46e5", height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, elevation: 4 }}
          >
            <TabBarIcon name="add" color="white" size={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={employees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80, backgroundColor: "white", borderRadius: 24, borderStyle: "dashed", borderWidth: 1, borderColor: "#cbd5e1" }}>
              <TabBarIcon name="people-outline" color="#cbd5e1" size={60} />
              <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 16, fontWeight: "bold" }}>
                No active employees
              </Text>
              <TouchableOpacity 
                onPress={() => router.push("/(owner)/add-employee")}
                style={{ marginTop: 16, backgroundColor: "#eef2ff", paddingHorizontal: 24, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: "#e0e7ff" }}
              >
                <Text style={{ color: "#4f46e5", fontWeight: "bold" }}>Add first member</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Remove Employee?"
        message={`This will permanently remove ${deleteTarget?.name} from your system records. This action cannot be reversed.`}
        confirmText="Yes, Delete"
        variant="delete"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </View>
  );
}


