import { Redirect, Slot } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  // `(protected)` only ever contains the `(tabs)` group — a bare Slot avoids nesting a
  // redundant Stack navigator (of exactly one screen) around the Tabs navigator underneath it.
  return <Slot />;
}
