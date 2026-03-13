import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import { formatCurrency } from '@/src/utils/salary';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MySalary() {
  const { userData } = useAuth();
  const { attendance, bonuses } = useData();

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthAttendance = attendance.filter(rec => {
    const d = rec.date?.toDate();
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const monthBonuses = bonuses.filter((b: any) => {
    const d = b.toDate?.toDate();
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const shiftSalary = monthAttendance.reduce((acc: number, r: any) => acc + (r.shiftSalary || 0), 0);
  const otSalary = monthAttendance.reduce((acc: number, r: any) => acc + (r.otSalary || 0), 0);
  const totalBonus = monthBonuses.reduce((acc: number, b: any) => acc + (b.bonusAmount || 0), 0);
  const totalSalary = shiftSalary + otSalary + totalBonus;

  const Row = ({ label, value, isBold = false, isGreen = false }: any) => (
    <View className="flex-row justify-between mb-4">
      <Text className={`text-gray-600 ${isBold ? 'font-bold' : ''}`}>{label}</Text>
      <Text className={`${isBold ? 'font-bold text-lg' : 'font-semibold'} ${isGreen ? 'text-green-600' : 'text-gray-800'}`}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Salary Breakdown</Text>
        <Text className="text-gray-500 mb-6">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <View className="items-center mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Total Earnings</Text>
            <Text className="text-4xl font-black text-green-600">{formatCurrency(totalSalary)}</Text>
          </View>

          <View className="h-[1] bg-gray-100 mb-6" />

          <Row label="Shift Earnings" value={formatCurrency(shiftSalary)} />
          <Row label="OT Earnings" value={formatCurrency(otSalary)} />
          <Row label="Monthly Bonus" value={formatCurrency(totalBonus)} />

          <View className="h-[1] bg-gray-100 my-4" />
          
          <Row label="Net Salary" value={formatCurrency(totalSalary)} isBold isGreen />
        </View>

        <View className="bg-green-50 p-6 rounded-3xl border border-green-100">
           <Text className="text-green-800 font-bold mb-2">Salary Policy</Text>
           <Text className="text-green-600 text-sm leading-5">
             Your salary is calculated based on your hourly rate of {formatCurrency(userData?.hourlyRate || 0)}. 
             Bonus is calculated separately based on total shift hours only.
           </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
