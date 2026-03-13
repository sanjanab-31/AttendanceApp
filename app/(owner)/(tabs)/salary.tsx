import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { calculateTotalShiftHours, calculateTotalOTHours, formatCurrency } from '@/src/utils/salary';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';

const parseRecordDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const toNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeCurrency = (value: any) => formatCurrency(toNumber(value));

export default function SalarySummary() {
  const { employees, attendance, bonuses } = useData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    if (!employees.length) {
      setSelectedEmployeeId('');
      return;
    }

    const selectedEmployeeExists = employees.some((e: any) => e.id === selectedEmployeeId);
    if (!selectedEmployeeId || !selectedEmployeeExists) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  const employee = employees.find((e: any) => e.id === selectedEmployeeId);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const employeeAttendance = attendance.filter((record: any) => 
    record.employeeId === (employee?.employeeId || '') &&
    (() => {
      const recordDate = parseRecordDate(record.date);
      return recordDate
        ? recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear
        : false;
    })()
  );

  const employeeBonuses = bonuses.filter((b: any) => 
    b.employeeId === (employee?.employeeId || '') &&
    (() => {
      const recordDate = parseRecordDate(b.toDate);
      return recordDate
        ? recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear
        : false;
    })()
  );

  const totalShiftHours = calculateTotalShiftHours(employeeAttendance);
  const totalOTHours = calculateTotalOTHours(employeeAttendance);
  const totalShiftSalary = employeeAttendance.reduce((acc: number, rec: any) => acc + toNumber(rec.shiftSalary), 0);
  const totalOTSalary = employeeAttendance.reduce((acc: number, rec: any) => acc + toNumber(rec.otSalary), 0);
  const totalBonus = employeeBonuses.reduce((acc: number, rec: any) => acc + toNumber(rec.bonusAmount), 0);
  const grossSalary = totalShiftSalary + totalOTSalary + totalBonus;
  const hourlyRate = toNumber(employee?.hourlyRate);

  const Row = ({ label, value, isBold = false, isGreen = false }: any) => (
    <View className="flex-row justify-between mb-4">
      <Text className={`text-gray-600 ${isBold ? 'font-bold' : ''}`}>{label}</Text>
      <Text className={`${isBold ? 'font-bold text-lg' : 'font-semibold'} ${isGreen ? 'text-green-600' : 'text-gray-800'}`}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">Salary Summary</Text>

        <Text className="text-gray-500 mb-3 font-medium uppercase text-xs">Select Employee</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 max-h-14">
          {employees.map((emp: any) => (
            <TouchableOpacity 
              key={emp.id}
              onPress={() => setSelectedEmployeeId(emp.id)}
              className={`mr-3 px-5 py-3 rounded-2xl border ${selectedEmployeeId === emp.id ? 'bg-blue-600 border-blue-600 shadow-md' : 'bg-white border-gray-200'}`}
            >
              <Text className={`font-semibold ${selectedEmployeeId === emp.id ? 'text-white' : 'text-gray-700'}`}>{emp.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {employee ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <View className="items-center mb-6">
                  <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-2">
                    <TabBarIcon name="cash-outline" color="#3b82f6" size={40} />
                  </View>
                  <Text className="text-xl font-bold text-gray-800">{employee.name}</Text>
                  <Text className="text-gray-500">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
               </View>

               <View className="h-[1] bg-gray-100 mb-6" />

               <Row label="Total Shift Hours" value={`${totalShiftHours} hrs`} />
               <Row label="Total OT Hours" value={`${totalOTHours} hrs`} />
               <Row label="Shift Salary" value={safeCurrency(totalShiftSalary)} />
               <Row label="OT Salary" value={safeCurrency(totalOTSalary)} />
               <Row label="Bonus Received" value={safeCurrency(totalBonus)} />
               
               <View className="h-[1] bg-gray-100 my-4" />
               
               <Row label="Total Net Salary" value={safeCurrency(grossSalary)} isBold isGreen />
            </View>
            
            <View className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 italic">
               <Text className="text-blue-600 text-center text-sm">
                 "Salary is calculated based on the hourly rate of {safeCurrency(hourlyRate)} fixed at the time of joining."
               </Text>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center">
             <Text className="text-gray-400">Please add employees first</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
