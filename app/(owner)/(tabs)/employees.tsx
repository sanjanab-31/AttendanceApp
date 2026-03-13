import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { useRouter } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { formatCurrency } from '@/src/utils/salary';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/src/context/ToastContext';

export default function EmployeeManagement() {
  const { employees, deleteEmployee } = useData();
  const router = useRouter();
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      showToast('Employee deleted successfully!', 'success');
      setDeleteTarget(null);
    } catch (error: any) {
      showToast(error?.message || 'Unable to delete employee.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderEmployee = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.email}</Text>
        <View className="flex-row items-center mt-2">
           <View className="bg-blue-50 px-2 py-1 rounded-md mr-2">
             <Text className="text-blue-600 text-xs font-semibold">{item.employeeId}</Text>
           </View>
           <Text className="text-gray-600 text-xs font-medium">{formatCurrency(item.hourlyRate)}/hr</Text>
        </View>
      </View>
      
      <View className="flex-row space-x-2">
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/(owner)/edit-employee', params: { id: item.id } })}
          className="bg-gray-100 p-3 rounded-full mr-2"
        >
          <TabBarIcon name="pencil" color="#4b5563" size={20} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item.id, item.name)}
          className="bg-red-50 p-3 rounded-full"
        >
          <TabBarIcon name="trash" color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-20">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">Employees</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(owner)/add-employee')}
            className="bg-blue-600 flex-row items-center px-4 py-2 rounded-xl"
          >
            <TabBarIcon name="add" color="white" size={20} />
            <Text className="text-white font-bold ml-1">Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={employees}
          renderItem={renderEmployee}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <TabBarIcon name="people-outline" color="#d1d5db" size={80} />
              <Text className="text-gray-400 mt-4 text-lg">No employees found</Text>
            </View>
          }
        />
      </View>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Confirm Deletion"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        variant="delete"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}
