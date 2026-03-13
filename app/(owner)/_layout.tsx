import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-employee" options={{ headerShown: true, title: 'Add Employee' }} />
      <Stack.Screen name="edit-employee" options={{ headerShown: true, title: 'Edit Employee' }} />
      <Stack.Screen name="mark-attendance" options={{ headerShown: true, title: 'Mark Attendance' }} />
      <Stack.Screen name="bonus-management" options={{ headerShown: true, title: 'Bonus Management' }} />
    </Stack>
  );
}
