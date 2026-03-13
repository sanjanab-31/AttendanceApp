import React from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { useRouter } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { formatCurrency } from '@/src/utils/salary';

export default function EmployeeManagement() {
  const { employees, deleteEmployee } = useData();
  const router = useRouter();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(id);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
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
    <SafeAreaView className="flex-1 bg-gray-50">
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
    </SafeAreaView>
  );
}
