import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useColors } from './colors';

/** Navigation theme (screen backgrounds, pushed-screen headers) derived from the app palette. */
export function useNavigationTheme(): Theme {
    const dark = useColorScheme() === 'dark';
    const colors = useColors();

    return useMemo(() => {
        const base = dark ? DarkTheme : DefaultTheme;
        return { ...base, colors: { ...base.colors, primary: colors.accent, background: colors.groupedBackground, card: colors.groupedBackground, text: colors.label, border: colors.separator } };
    }, [dark, colors]);
}
