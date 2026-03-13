import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const timeoutId = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [rootNavigationState?.key, router]);

  return <View className="flex-1 bg-white" />;
}
