// ABOUTME: Provides a React context for toggling between light and dark MUI theme modes.
// ABOUTME: Eliminates prop drilling of mode/setMode through the component tree.

import { createContext, useContext } from 'react';

interface ThemeModeContextValue {
    mode: 'light' | 'dark';
    toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function useThemeMode(): ThemeModeContextValue {
    const ctx = useContext(ThemeModeContext);
    if (!ctx) {
        throw new Error('useThemeMode must be used within a ThemeModeProvider');
    }
    return ctx;
}

export default ThemeModeContext;
