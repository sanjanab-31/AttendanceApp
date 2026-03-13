import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyProfile() {
  const { userData, logout } = useAuth();

  const InfoRow = ({ icon, label, value }: any) => (
    <View className="flex-row items-center mb-6">
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
         <TabBarIcon name={icon} color="#6b7280" size={20} />
      </View>
      <View>
        <Text className="text-gray-400 text-[10px] uppercase font-bold">{label}</Text>
        <Text className="text-gray-800 font-semibold text-base">{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        <View className="items-center mt-10 mb-10">
           <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">🧑‍💼</Text>
           </View>
           <Text className="text-2xl font-bold text-gray-800">{userData?.name}</Text>
           <Text className="text-blue-600 font-semibold">Employee ID: {userData?.employeeId}</Text>
        </View>

        <View className="bg-gray-50 p-6 rounded-3xl mb-8">
           <InfoRow icon="call-outline" label="Phone" value={userData?.phone} />
           <InfoRow icon="mail-outline" label="Email" value={userData?.email} />
           <InfoRow icon="time-outline" label="Hourly Rate" value={`₹${userData?.hourlyRate}/hr`} />
           <InfoRow icon="calendar-outline" label="Joining Date" value={userData?.joiningDate} />
        </View>

        <TouchableOpacity 
          onPress={logout}
          className="bg-red-50 p-5 rounded-2xl flex-row items-center justify-center mb-10"
        >
          <TabBarIcon name="log-out-outline" color="#ef4444" size={24} />
          <Text className="text-red-500 font-bold text-lg ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
