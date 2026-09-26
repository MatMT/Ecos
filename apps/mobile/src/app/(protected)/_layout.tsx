import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { StudentProvider } from '@/hooks/use-student';
import { ThemeProvider } from '@/context/theme-context';
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
    <StudentProvider>
      <ThemeProvider>
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
          name="settings"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="sleep-detail"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="modals/alerts-history"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      </ThemeProvider>
    </StudentProvider>
  );
}
