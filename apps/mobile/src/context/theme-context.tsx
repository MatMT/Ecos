import React, { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useStudent, type VisualTheme } from '@/hooks/use-student';

export interface ThemeColors {
  background: string;
  card: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  brand: string;
  brandDark: string;
  brandLight: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  inputBackground: string;
  tagBackground: string;
  tagText: string;
  status: {
    normal: string;
    elevated: string;
    high: string;
  };
  danger: string;
  dangerSurface: string;
  dangerBorder: string;
}

export const THEME_PALETTES: Record<VisualTheme, ThemeColors> = {
  salvia: {
    background: '#F4F7F5', // Blanco hueso verdoso
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#EDF3F0',
    border: '#E2ECE5',
    borderSubtle: '#EEF5F1',
    brand: '#4E8777', // Verde salvia calmante
    brandDark: '#24433B',
    brandLight: '#E8F2EE',
    accent: '#0D9488',
    text: '#162722',
    textSecondary: '#526E65',
    textMuted: '#8BA39B',
    placeholder: '#8BA39B',
    inputBackground: '#EDF3F0',
    tagBackground: '#E8F2EE',
    tagText: '#4E8777',
    status: {
      normal: '#4E8777',
      elevated: '#6482AD',
      high: '#D97D64',
    },
    danger: '#DC2626',
    dangerSurface: '#FFF1F2',
    dangerBorder: '#FFE4E6',
  },
  niebla: {
    background: '#F5F8FA', // Blanco nieve azulado
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#EDF2F7',
    border: '#DEE5EC',
    borderSubtle: '#EEF3F8',
    brand: '#5A7B9D', // Azul pizarra y lavanda sereno
    brandDark: '#273C52',
    brandLight: '#EAF0F6',
    accent: '#4F709C',
    text: '#1A2530',
    textSecondary: '#5B6B7C',
    textMuted: '#8E9CAE',
    placeholder: '#8E9CAE',
    inputBackground: '#EDF2F7',
    tagBackground: '#EAF0F6',
    tagText: '#5A7B9D',
    status: {
      normal: '#5A7B9D',
      elevated: '#8B7FB5',
      high: '#D97D64',
    },
    danger: '#DC2626',
    dangerSurface: '#FFF1F2',
    dangerBorder: '#FFE4E6',
  },
  arena: {
    background: '#FAF8F5', // Crema cálido
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F5EFEB',
    border: '#EBE5DD',
    borderSubtle: '#F4EFE9',
    brand: '#8C6D58', // Ocre arena y tierra suave
    brandDark: '#4A3525',
    brandLight: '#F4EDE7',
    accent: '#A07A60',
    text: '#2B201A',
    textSecondary: '#735F52',
    textMuted: '#A6968B',
    placeholder: '#A6968B',
    inputBackground: '#F5EFEB',
    tagBackground: '#F4EDE7',
    tagText: '#8C6D58',
    status: {
      normal: '#7D8A58',
      elevated: '#C98A4B',
      high: '#D97D64',
    },
    danger: '#DC2626',
    dangerSurface: '#FFF1F2',
    dangerBorder: '#FFE4E6',
  },
};

interface ThemeContextValue {
  theme: VisualTheme;
  colors: ThemeColors;
  setTheme: (theme: VisualTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'salvia',
  colors: THEME_PALETTES.salvia,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const { visualTheme, updatePreferences } = useStudent();

  const theme: VisualTheme = visualTheme || 'salvia';
  const colors = useMemo(() => THEME_PALETTES[theme] || THEME_PALETTES.salvia, [theme]);

  const value = useMemo(
    () => ({
      theme,
      colors,
      setTheme: async (newTheme: VisualTheme) => {
        await updatePreferences({ visualTheme: newTheme });
      },
    }),
    [theme, colors, updatePreferences],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
