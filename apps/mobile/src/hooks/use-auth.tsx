import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { authClient, type AuthUser } from '@/services/api/auth-client';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GENERIC_LOGIN_ERROR =
  'No fue posible iniciar sesión. Verifique sus credenciales e intente nuevamente.';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authClient
      .restoreSession()
      .then((restoredUser) => {
        if (!cancelled) setUser(restoredUser);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
      login: async (email: string, password: string) => {
        setError(null);
        try {
          const loggedInUser = await authClient.login(email, password);
          setUser(loggedInUser);
        } catch (err) {
          const message = err instanceof Error ? err.message : GENERIC_LOGIN_ERROR;
          setError(message);
          throw err;
        }
      },
      logout: async () => {
        await authClient.logout();
        setUser(null);
      },
    }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
