import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { syncDispatcher } from '@/services/sync/sync-dispatcher';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      syncDispatcher.startPeriodicSync(30000);
      return () => {
        syncDispatcher.stopPeriodicSync();
      };
    }
  }, [isAuthenticated]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="esp32-prototype" />
      <Stack.Screen
        name="modals/breathing-guide"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/panic-alert"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="modals/alerts-history"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
