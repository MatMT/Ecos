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
    background: '#F2F9F8', // Blanco aqua suave y luminoso
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#E6F4F1',
    border: '#D0EBE6',
    borderSubtle: '#E8F5F3',
    brand: '#0F766E', // Deep Teal característico y por defecto de Ecos
    brandDark: '#115E59',
    brandLight: '#CCFBF1',
    accent: '#0D9488',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    placeholder: '#94A3B8',
    inputBackground: '#F0FDF4',
    tagBackground: '#CCFBF1',
    tagText: '#0F766E',
    status: {
      normal: '#0F766E',
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
    background: '#F8F6F2', // Avena / Pergamino suave (greige neutro cálido)
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F2EDE6',
    border: '#EAE5DD', // Tono cálido atenuado
    borderSubtle: '#F2EDE6',
    brand: '#9E866C', // Lino y avena neutro y relajante
    brandDark: '#3E342B',
    brandLight: '#F3EFE9',
    accent: '#8C755D',
    text: '#26201B',
    textSecondary: '#6B5E53',
    textMuted: '#9E9287',
    placeholder: '#9E9287',
    inputBackground: '#F4F0EA',
    tagBackground: '#F3EFE9',
    tagText: '#6B5E53',
    status: {
      normal: '#4B7A60', // Verde eucalipto armónico sobre cálido
      elevated: '#C48A3F', // Ocre suave atenuado
      high: '#B85244', // Terracota / ladrillo suave
    },
    danger: '#B85244',
    dangerSurface: '#FDF3F1',
    dangerBorder: '#F8DDD9',
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
