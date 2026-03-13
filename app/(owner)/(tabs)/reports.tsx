import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { formatCurrency } from '@/src/utils/salary';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Reports() {
  const { employees, attendance, bonuses } = useData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const selectedEmployee = employees.find((e: any) => e.id === selectedEmployeeId);

  const filteredAttendance = attendance.filter((record: any) => {
    let match = true;
    if (selectedEmployee) match = record.employeeId === selectedEmployee.employeeId;
    if (fromDate) match = match && record.date?.toDate() >= new Date(fromDate);
    if (toDate) match = match && record.date?.toDate() <= new Date(toDate);
    return match;
  });

  const filteredBonuses = bonuses.filter((b: any) => {
    let match = true;
    if (selectedEmployee) match = b.employeeId === selectedEmployee.employeeId;
    if (fromDate) match = match && b.toDate?.toDate() >= new Date(fromDate);
    if (toDate) match = match && b.toDate?.toDate() <= new Date(toDate);
    return match;
  });

  const stats = {
    shiftHours: filteredAttendance.reduce((acc: number, r: any) => acc + r.shiftHours, 0),
    otHours: filteredAttendance.reduce((acc: number, r: any) => acc + r.otHours, 0),
    salary: filteredAttendance.reduce((acc: number, r: any) => acc + r.totalSalary, 0),
    bonus: filteredBonuses.reduce((acc: number, b: any) => acc + b.bonusAmount, 0)
  };

  const StatBox = ({ label, value, color }: any) => (
    <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 m-1">
      <Text className="text-gray-400 text-[10px] uppercase font-bold mb-1">{label}</Text>
      <Text className={`text-base font-bold ${color}`}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Business Reports</Text>

        <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <Text className="text-gray-600 mb-3 font-medium text-sm">Filters</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <TouchableOpacity 
              onPress={() => setSelectedEmployeeId('')}
              className={`mr-2 px-3 py-2 rounded-lg border ${selectedEmployeeId === '' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-xs font-bold ${selectedEmployeeId === '' ? 'text-white' : 'text-gray-500'}`}>All Employees</Text>
            </TouchableOpacity>
            {employees.map((emp: any) => (
              <TouchableOpacity 
                key={emp.id}
                onPress={() => setSelectedEmployeeId(emp.id)}
                className={`mr-2 px-3 py-2 rounded-lg border ${selectedEmployeeId === emp.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-xs font-bold ${selectedEmployeeId === emp.id ? 'text-white' : 'text-gray-500'}`}>{emp.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row space-x-2">
             <View className="flex-1">
                <TextInput className="bg-gray-50 p-3 rounded-xl text-xs border border-gray-100" placeholder="From: YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} />
             </View>
             <View className="flex-1">
                <TextInput className="bg-gray-50 p-3 rounded-xl text-xs border border-gray-100" placeholder="To: YYYY-MM-DD" value={toDate} onChangeText={setToDate} />
             </View>
          </View>
        </View>

        <View className="flex-row flex-wrap mb-6">
          <StatBox label="Total Shift" value={`${stats.shiftHours} hrs`} color="text-blue-600" />
          <StatBox label="Total OT" value={`${stats.otHours} hrs`} color="text-indigo-600" />
          <StatBox label="Total Salary" value={formatCurrency(stats.salary)} color="text-green-600" />
          <StatBox label="Total Bonus" value={formatCurrency(stats.bonus)} color="text-orange-600" />
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-4">Detailed Breakdown</Text>
        <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
           <View className="bg-gray-50 p-4 border-b border-gray-100 flex-row">
              <Text className="flex-2 text-gray-400 font-bold text-[10px] uppercase">Employee</Text>
              <Text className="flex-1 text-gray-400 font-bold text-[10px] uppercase text-center">Hours</Text>
              <Text className="flex-1 text-gray-400 font-bold text-[10px] uppercase text-right">Amount</Text>
           </View>
           {filteredAttendance.length > 0 ? filteredAttendance.map((item, idx) => (
             <View key={item.id} className={`p-4 flex-row ${idx !== filteredAttendance.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <View className="flex-2">
                  <Text className="font-bold text-gray-800 text-xs">{item.employeeName}</Text>
                  <Text className="text-gray-400 text-[10px]">{item.date?.toDate().toLocaleDateString()}</Text>
                </View>
                <Text className="flex-1 text-gray-600 text-xs text-center font-medium">{item.shiftHours + item.otHours}h</Text>
                <Text className="flex-1 text-gray-800 text-xs font-bold text-right">{formatCurrency(item.totalSalary)}</Text>
             </View>
           )) : (
             <View className="p-10 items-center">
               <Text className="text-gray-300">No records found</Text>
             </View>
           )}
        </View>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
