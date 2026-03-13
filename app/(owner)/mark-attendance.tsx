import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { useRouter } from 'expo-router';
import { calculateSalaryBreakdown, formatCurrency } from '@/src/utils/salary';

const getDateKey = (value: any) => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MarkAttendance() {
  const { employees, attendance, markAttendance } = useData();
  const router = useRouter();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [date, setDate] = useState(getDateKey(new Date()));
  const [shiftHours, setShiftHours] = useState('8');
  const [otHours, setOtHours] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedEmployee = employees.find((e: any) => e.id === selectedEmployeeId);
  const existingAttendanceRecord = selectedEmployee
    ? attendance.find((record: any) => {
        if (record.employeeId !== selectedEmployee.employeeId) {
          return false;
        }

        const recordDate = record.date?.toDate?.() || record.date;
        return getDateKey(record.dateKey || recordDate) === getDateKey(date);
      })
    : undefined;
  const isUpdateMode = Boolean(existingAttendanceRecord);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setShiftHours('8');
      setOtHours('0');
      setRemarks('');
      return;
    }

    if (existingAttendanceRecord) {
      setShiftHours(String(existingAttendanceRecord.shiftHours ?? '8'));
      setOtHours(String(existingAttendanceRecord.otHours ?? '0'));
      setRemarks(existingAttendanceRecord.remarks || '');
      return;
    }

    setShiftHours('8');
    setOtHours('0');
    setRemarks('');
  }, [selectedEmployeeId, date, existingAttendanceRecord]);

  const salaryPreview = selectedEmployee 
    ? calculateSalaryBreakdown(parseFloat(shiftHours || '0'), parseFloat(otHours || '0'), selectedEmployee.hourlyRate)
    : null;

  const handleSave = async () => {
    if (!selectedEmployeeId || !date || !shiftHours) {
      Alert.alert('Error', 'Please select employee, date and shift hours');
      return;
    }

    setLoading(true);
    try {
      if (!salaryPreview) return;

      const result = await markAttendance({
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        date: date,
        shiftHours: parseFloat(shiftHours),
        otHours: parseFloat(otHours || '0'),
        remarks,
        shiftSalary: salaryPreview.shiftSalary,
        otSalary: salaryPreview.otSalary,
        totalSalary: salaryPreview.totalSalary
      });

      Alert.alert('Success', result === 'updated' ? 'Attendance updated successfully' : 'Attendance marked successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
        {/* Employee Selection */}
        <Text className="text-gray-600 mb-2 font-medium">Select Employee</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {employees.map((emp: any) => (
            <TouchableOpacity 
              key={emp.id}
              onPress={() => setSelectedEmployeeId(emp.id)}
              className={`mr-3 px-4 py-3 rounded-2xl border ${selectedEmployeeId === emp.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`font-semibold ${selectedEmployeeId === emp.id ? 'text-white' : 'text-gray-700'}`}>{emp.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date Selection */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-2 font-medium">Date</Text>
          <TextInput
            className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-800 shadow-sm"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {isUpdateMode ? (
          <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Text className="font-semibold text-amber-900">Existing attendance found for this employee and date.</Text>
            <Text className="mt-1 text-amber-700">The form is in update mode. Saving will update Shift Hours, OT Hours and Remarks instead of creating a duplicate record.</Text>
          </View>
        ) : null}

        {/* Shift Hours Selection */}
        <Text className="text-gray-600 mb-2 font-medium">Shift Hours</Text>
        <View className="flex-row justify-between mb-4">
          {['5', '6', '7', '8'].map(h => (
            <TouchableOpacity 
              key={h}
              onPress={() => setShiftHours(h)}
              className={`flex-1 mx-1 p-3 rounded-xl border items-center ${shiftHours === h ? 'bg-blue-100 border-blue-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`font-bold ${shiftHours === h ? 'text-blue-600' : 'text-gray-600'}`}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* OT Hours */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-2 font-medium">OT Hours</Text>
          <TextInput
            className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-800 shadow-sm"
            value={otHours}
            onChangeText={setOtHours}
            placeholder="Enter OT hours"
            keyboardType="numeric"
          />
        </View>

        {/* Remarks */}
        <View className="mb-6">
          <Text className="text-gray-600 mb-2 font-medium">Remarks</Text>
          <TextInput
            className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-800 shadow-sm h-24"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any special notes?"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Salary Preview */}
        {salaryPreview && (
          <View className="bg-blue-50 p-5 rounded-3xl border border-blue-100 mb-8">
            <Text className="text-blue-800 font-bold text-lg mb-3">Salary Preview</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-blue-700">Shift Salary:</Text>
              <Text className="text-blue-900 font-semibold">{formatCurrency(salaryPreview.shiftSalary)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-blue-700">OT Salary:</Text>
              <Text className="text-blue-900 font-semibold">{formatCurrency(salaryPreview.otSalary)}</Text>
            </View>
            <View className="h-[1] bg-blue-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-blue-800 font-bold">Total Daily:</Text>
              <Text className="text-blue-900 font-bold text-xl">{formatCurrency(salaryPreview.totalSalary)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          className={`bg-blue-600 p-5 rounded-2xl mb-10 items-center shadow-lg ${loading ? 'opacity-70' : ''}`}
          onPress={handleSave}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">{loading ? 'Saving...' : isUpdateMode ? 'Update Attendance' : 'Save Attendance'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
