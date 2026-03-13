import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useData } from '@/src/context/DataContext';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditEmployee() {
  const { employees, updateEmployee } = useData();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hourlyRate: '',
    joiningDate: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const employee = employees.find((e: any) => e.id === id);
    if (employee) {
      setFormData({
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        hourlyRate: employee.hourlyRate.toString(),
        joiningDate: employee.joiningDate,
      });
    }
  }, [id, employees]);

  const handleSave = async () => {
    const { name, phone, email, hourlyRate, joiningDate } = formData;

    if (!name || !phone || !email || !hourlyRate || !joiningDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await updateEmployee(id as string, {
        name,
        phone,
        email,
        hourlyRate: parseFloat(hourlyRate),
        joiningDate,
      });

      Alert.alert('Success', 'Employee updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View className="mb-4">
      <Text className="text-gray-600 mb-2 font-medium">{label}</Text>
      <TextInput
        className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-800 shadow-sm"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
          <InputField label="Full Name" value={formData.name} onChangeText={(text: string) => setFormData({...formData, name: text})} placeholder="John Doe" />
          <InputField label="Phone Number" value={formData.phone} onChangeText={(text: string) => setFormData({...formData, phone: text})} placeholder="1234567890" keyboardType="phone-pad" />
          <InputField label="Email Address" value={formData.email} onChangeText={(text: string) => setFormData({...formData, email: text})} placeholder="john@example.com" keyboardType="email-address" />
          <InputField label="Hourly Rate (₹)" value={formData.hourlyRate} onChangeText={(text: string) => setFormData({...formData, hourlyRate: text})} placeholder="500" keyboardType="numeric" />
          <InputField label="Joining Date" value={formData.joiningDate} onChangeText={(text: string) => setFormData({...formData, joiningDate: text})} placeholder="YYYY-MM-DD" />

          <TouchableOpacity 
            className={`bg-blue-600 p-4 rounded-2xl mt-4 mb-10 items-center ${loading ? 'opacity-70' : ''}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Saving...' : 'Update Details'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
