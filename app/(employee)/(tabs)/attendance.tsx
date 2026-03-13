import React from 'react';
import { View, Text, FlatList, SafeAreaView } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { formatCurrency } from '@/src/utils/salary';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';

export default function MyAttendance() {
  const { attendance } = useData();

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100">
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-lg font-bold text-gray-800">
            {item.date?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text className="text-gray-500 text-sm">Status: Present</Text>
        </View>
        <View className="bg-green-100 px-3 py-1 rounded-full">
          <Text className="text-green-700 font-bold text-xs">{formatCurrency(item.totalSalary)}</Text>
        </View>
      </View>
      
      <View className="flex-row bg-gray-50 p-3 rounded-xl">
        <View className="flex-1">
          <Text className="text-gray-400 text-[10px] uppercase font-bold">Shift</Text>
          <Text className="text-gray-700 font-bold">{item.shiftHours} hrs</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-400 text-[10px] uppercase font-bold">OT</Text>
          <Text className="text-gray-700 font-bold">{item.otHours} hrs</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-400 text-[10px] uppercase font-bold">Total</Text>
          <Text className="text-gray-700 font-bold">{item.shiftHours + item.otHours} hrs</Text>
        </View>
      </View>

      {item.remarks ? (
        <View className="mt-3 border-t border-gray-100 pt-2">
           <Text className="text-gray-400 text-xs italic">Notes: {item.remarks}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 flex-1">
        <Text className="text-2xl font-bold text-gray-800 mb-6">Attendance History</Text>
        
        <FlatList
          data={attendance}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <TabBarIcon name="calendar-outline" color="#d1d5db" size={80} />
              <Text className="text-gray-400 mt-4 text-lg">No records found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
