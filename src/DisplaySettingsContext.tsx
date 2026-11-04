// ABOUTME: Provides a React context for the display settings: the display mode (bright, dark, neutral) and the UI scale.
// ABOUTME: Eliminates prop drilling of the settings and their setters through the component tree.

import { createContext, useContext } from 'react';
import type { DisplayMode } from './Theme/DesignTokens';

interface DisplaySettingsContextValue {
    mode: DisplayMode;
    setMode: (mode: DisplayMode) => void;
    uiScale: number;
    setUiScale: (uiScale: number) => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextValue | null>(null);

export function useDisplaySettings(): DisplaySettingsContextValue {
    const context = useContext(DisplaySettingsContext);
    if (!context) {
        throw new Error('useDisplaySettings must be used within a DisplaySettingsContext provider');
    }
    return context;
}

export default DisplaySettingsContext;
