// ABOUTME: Root application component. Sets up the theme from the display settings (mode, UI scale) and the scenario's
// ABOUTME: appearance (accent, default mode), the framework's commands and shortcuts, and the layout manager.

import React, { useCallback, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import '@fontsource-variable/inter';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import './App.css';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LayoutManager from './LayoutManager/LayoutManager';
import { ScenarioProvider, useScenario } from './ScenarioManager/ScenarioManager';
import DisplaySettingsContext from './DisplaySettingsContext';
import { createAppTheme } from './Theme/AppTheme';
import type { DisplayMode } from './Theme/DesignTokens';
import { commandRegistry } from './Commands/CommandRegistry';
import { frameworkCommands } from './Commands/FrameworkCommands';
import ShortcutsDialog from './Commands/ShortcutsDialog';

interface AppProps {
    initialConfig: string;
}

const ThemedApp = observer(() => {
    const scenario = useScenario();
    const systemMode: DisplayMode =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'bright';
    // The scenario's appearance holds the mode and UI scale (picks in the navbar write them back); without a mode in
    // the config, the system's light or dark preference applies.
    const mode = scenario.appearance.defaultMode ?? systemMode;
    const uiScale = scenario.appearance.uiScale;
    const setMode = useCallback((choice: DisplayMode) => scenario.setDisplayMode(choice), [scenario]);
    const setUiScale = useCallback((choice: number) => scenario.setUiScale(choice), [scenario]);
    const accent = scenario.appearance.accent;

    const theme = useMemo(() => createAppTheme(mode, accent, uiScale), [mode, accent, uiScale]);
    const displaySettings = useMemo(() => ({ mode, setMode, uiScale, setUiScale }), [mode, setMode, uiScale, setUiScale]);

    const modeRef = React.useRef(mode);
    const uiScaleRef = React.useRef(uiScale);
    modeRef.current = mode;
    uiScaleRef.current = uiScale;

    useEffect(() => {
        const unregister = frameworkCommands(commandRegistry, {
            panelLayouts: () => scenario.panelLayouts,
            mode: () => modeRef.current,
            setMode,
            uiScale: () => uiScaleRef.current,
            setUiScale,
        }).map(command => commandRegistry.register(command));
        window.addEventListener('keydown', commandRegistry.handleKeyDown);
        return () => {
            unregister.forEach(unregisterCommand => unregisterCommand());
            window.removeEventListener('keydown', commandRegistry.handleKeyDown);
        };
    }, [scenario, setMode, setUiScale]);

    return (
        <DisplaySettingsContext.Provider value={displaySettings}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <LayoutManager />
                <ShortcutsDialog />
            </ThemeProvider>
        </DisplaySettingsContext.Provider>
    );
});

function App({ initialConfig }: AppProps) {
    return (
        <ScenarioProvider initialConfig={initialConfig}>
            <ThemedApp />
        </ScenarioProvider>
    );
}

export default App;
