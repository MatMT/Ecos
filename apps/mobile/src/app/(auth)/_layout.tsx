import { Redirect, Slot } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href="/(protected)/(tabs)/home" />;

  // `(auth)` only ever contains `login` — a bare Slot avoids nesting a redundant Stack
  // navigator around it.
  return <Slot />;
}
