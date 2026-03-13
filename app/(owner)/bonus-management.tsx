import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { calculateTotalShiftHours, formatCurrency } from '@/src/utils/salary';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BonusManagement() {
  const { employees, attendance, addBonus } = useData();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bonus for all or individual? Let's implement individual bonus for now as per requirement.
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const selectedEmployee = employees.find((e: any) => e.id === selectedEmployeeId);

  const filteredAttendance = attendance.filter((record: any) => {
    if (!selectedEmployee || !fromDate || !toDate) return false;
    const date = record.date?.toDate();
    const start = new Date(fromDate);
    const end = new Date(toDate);
    return record.employeeId === selectedEmployee.employeeId && date >= start && date <= end;
  });

  const totalShiftHours = calculateTotalShiftHours(filteredAttendance);

  const handleCalculate = () => {
    if (!selectedEmployeeId || !fromDate || !toDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setIsCalculated(true);
  };

  const handleSaveBonus = async () => {
    if (!bonusAmount) {
      Alert.alert('Error', 'Please enter bonus amount');
      return;
    }

    setLoading(true);
    try {
      await addBonus({
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        fromDate,
        toDate,
        totalShiftHours,
        bonusAmount: parseFloat(bonusAmount)
      });

      Alert.alert('Success', 'Bonus assigned successfully');
      setBonusAmount('');
      setIsCalculated(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Bonus Management</Text>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <Text className="text-gray-600 mb-3 font-medium">1. Select Employee</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {employees.map((emp: any) => (
              <TouchableOpacity 
                key={emp.id}
                onPress={() => {
                  setSelectedEmployeeId(emp.id);
                  setIsCalculated(false);
                }}
                className={`mr-3 px-4 py-2 rounded-xl border ${selectedEmployeeId === emp.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
              >
                <Text className={`font-semibold ${selectedEmployeeId === emp.id ? 'text-white' : 'text-gray-700'}`}>{emp.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-gray-600 mb-3 font-medium">2. Select Date Range</Text>
          <View className="flex-row space-x-4 mb-6">
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-1">From</Text>
              <TextInput 
                className="bg-gray-50 p-3 rounded-xl border border-gray-100"
                placeholder="YYYY-MM-DD"
                value={fromDate}
                onChangeText={setFromDate}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-1">To</Text>
              <TextInput 
                className="bg-gray-50 p-3 rounded-xl border border-gray-100"
                placeholder="YYYY-MM-DD"
                value={toDate}
                onChangeText={setToDate}
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleCalculate}
            className="bg-blue-600 p-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold">Calculate Shift Hours</Text>
          </TouchableOpacity>
        </View>

        {isCalculated && (
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
            <View className="items-center mb-6">
               <Text className="text-gray-500 mb-1">Total Shift Hours for {selectedEmployee?.name}</Text>
               <Text className="text-4xl font-black text-blue-600">{totalShiftHours} hrs</Text>
               <Text className="text-gray-400 text-xs mt-1">OT hours excluded as per rules</Text>
            </View>

            <Text className="text-gray-600 mb-2 font-medium">3. Assign Bonus Amount (₹)</Text>
            <TextInput 
              className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-lg font-bold text-center mb-6"
              placeholder="0.00"
              keyboardType="numeric"
              value={bonusAmount}
              onChangeText={setBonusAmount}
            />

            <TouchableOpacity 
              onPress={handleSaveBonus}
              disabled={loading}
              className={`bg-green-600 p-4 rounded-2xl items-center shadow-lg ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Confirm & Save Bonus</Text>}
            </TouchableOpacity>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
