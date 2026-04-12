// ABOUTME: Root application component. Sets up MUI theming with dark/light mode support,
// ABOUTME: scenario context, and the layout manager.

import React, { useMemo, useCallback } from 'react';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import './App.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LayoutManager from './LayoutManager/LayoutManager';
import { ScenarioProvider } from './ScenarioManager/ScenarioManager';
import ThemeModeContext from './ThemeModeContext';

function App() {
    const systemTheme =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    const [mode, setMode] = React.useState<'light' | 'dark'>(systemTheme);

    const theme = useMemo(() => createTheme({
        palette: {
            mode: mode,
            primary: {
                main: '#BE0000',
            },
            secondary: {
                main: '#f50057',
            },
        },
        typography: {
            fontFamily: 'Roboto, Arial, sans-serif',
            fontSize: 20,
        },
    }), [mode]);

    const toggleMode = useCallback(() => {
        setMode(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const themeModeValue = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

    return (
        <ScenarioProvider>
            <ThemeModeContext.Provider value={themeModeValue}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <LayoutManager />
                </ThemeProvider>
            </ThemeModeContext.Provider>
        </ScenarioProvider>
    );
}

export default App;
