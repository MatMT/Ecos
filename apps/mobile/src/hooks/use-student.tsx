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
import {
  getSecureItem,
  setSecureItem,
} from '@/services/api/secure-session-storage';

export type VisualTheme = 'salvia' | 'niebla' | 'arena';
export type CheckInFrequency = 'low' | 'moderate' | 'high';

export interface StudentPreferences {
  preferredName?: string;
  visualTheme: VisualTheme;
  checkInFrequency: CheckInFrequency;
  sleepGoalHours: number;
}

const PREFERENCES_KEY = 'ecos_student_preferences';

const DEFAULT_PREFERENCES: StudentPreferences = {
  preferredName: undefined,
  visualTheme: 'salvia',
  checkInFrequency: 'moderate',
  sleepGoalHours: 8,
};

function fallbackGreetingName(email: string | undefined): string {
  if (!email) return 'Usuario';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

interface StudentContextValue {
  student: StudentProfileData | null;
  isLoading: boolean;
  error: string | null;
  refreshStudent: () => Promise<void>;
  preferences: StudentPreferences;
  preferredName: string | undefined;
  displayName: string;
  visualTheme: VisualTheme;
  checkInFrequency: CheckInFrequency;
  sleepGoalHours: number;
  updatePreferences: (newPrefs: Partial<StudentPreferences>) => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [preferences, setPreferences] = useState<StudentPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from secure storage on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const raw = await getSecureItem(PREFERENCES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StudentPreferences>;
          setPreferences((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch {
        // Fall back to default preferences if corrupted
      }
    }
    void loadPreferences();
  }, []);

  const updatePreferences = useCallback(
    async (newPrefs: Partial<StudentPreferences>) => {
      setPreferences((prev) => {
        const updated: StudentPreferences = {
          ...prev,
          ...newPrefs,
        };
        void setSecureItem(PREFERENCES_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [],
  );

  const refreshStudent = useCallback(async () => {
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
    if (!isAuthenticated) return;

    let active = true;
    studentClient
      .getMe()
      .then((data) => {
        if (active) {
          setStudent(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          const message =
            err instanceof Error
              ? err.message
              : 'No se pudo cargar el perfil del estudiante.';
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const currentStudent = isAuthenticated ? student : null;
  const currentIsLoading = isAuthenticated ? isLoading : false;
  const currentError = isAuthenticated ? error : null;

  const preferredName = preferences.preferredName?.trim();
  const studentFullName = currentStudent?.fullName?.trim();
  const displayName =
    preferredName && preferredName.length > 0
      ? preferredName
      : studentFullName && studentFullName.length > 0
      ? studentFullName
      : fallbackGreetingName(user?.email);

  const value = useMemo<StudentContextValue>(
    () => ({
      student: currentStudent,
      isLoading: currentIsLoading,
      error: currentError,
      refreshStudent,
      preferences,
      preferredName: preferences.preferredName,
      displayName,
      visualTheme: preferences.visualTheme,
      checkInFrequency: preferences.checkInFrequency,
      sleepGoalHours: preferences.sleepGoalHours || 8,
      updatePreferences,
    }),
    [currentStudent, currentIsLoading, currentError, refreshStudent, preferences, displayName, updatePreferences],
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

