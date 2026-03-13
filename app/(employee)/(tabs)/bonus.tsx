import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { formatCurrency } from '@/src/utils/salary';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyBonus() {
  const { bonuses } = useData();

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white p-6 rounded-3xl shadow-sm mb-4 border border-gray-100">
      <View className="flex-row justify-between items-center mb-4">
        <View className="bg-orange-100 p-3 rounded-full">
           <TabBarIcon name="gift" color="#f97316" size={24} />
        </View>
        <Text className="text-2xl font-black text-orange-600">{formatCurrency(item.bonusAmount)}</Text>
      </View>
      
      <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Benefit Period</Text>
      <View className="flex-row items-center mb-4">
         <Text className="text-gray-800 font-semibold">{item.fromDate}</Text>
         <Text className="text-gray-400 mx-2">→</Text>
         <Text className="text-gray-800 font-semibold">{item.toDate}</Text>
      </View>

      <View className="bg-gray-50 p-3 rounded-xl flex-row justify-between items-center">
         <Text className="text-gray-500 text-xs">Total Shift Hours</Text>
         <Text className="text-gray-800 font-bold">{item.totalShiftHours} hrs</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 flex-1">
        <Text className="text-2xl font-bold text-gray-800 mb-6">My Bonuses</Text>
        
        <FlatList
          data={bonuses}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <TabBarIcon name="gift-outline" color="#d1d5db" size={80} />
              <Text className="text-gray-400 mt-4 text-lg">No bonuses rewarded yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
