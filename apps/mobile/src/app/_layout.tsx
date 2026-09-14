import { Stack } from 'expo-router';

import { AuthProvider } from '@/hooks/use-auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(protected)" />
      </Stack>
    </AuthProvider>
  );
}
