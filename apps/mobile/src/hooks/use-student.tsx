import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/hooks/use-auth';
import {
  studentClient,
  type StudentProfileData,
} from '@/services/api/student-client';

interface StudentContextValue {
  student: StudentProfileData | null;
  isLoading: boolean;
  error: string | null;
  refreshStudent: () => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setStudent(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await studentClient.getMe();
      setStudent(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el perfil del estudiante.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const value = useMemo<StudentContextValue>(
    () => ({
      student,
      isLoading,
      error,
      refreshStudent: fetchProfile,
    }),
    [student, isLoading, error, fetchProfile],
  );

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
}

export function useStudent(): StudentContextValue {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
