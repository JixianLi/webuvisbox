import React, { useEffect } from 'react';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import './App.css';

import { ThemeProvider, createTheme, type Theme } from '@mui/material/styles';
import LayoutManager from './LayoutManager/LayoutManager';
import { ScenarioProvider } from './ScenarioManager/ScenarioManager';

function App() {
    const system_theme =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    const [mode, setMode] = React.useState<'light' | 'dark'>(system_theme);

    const theme: Theme = createTheme({
        palette: {
            mode: mode,
            primary: {
                main: '#BE0000',
            },
            secondary: {
                main: '#f50057',
            },
        },
    });

    useEffect(() => {
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.color = theme.palette.text.primary;
    }, [theme]);

    return (
        <ScenarioProvider>
            <ThemeProvider theme={theme}>
                <LayoutManager theme={theme} setMode={setMode} />
            </ThemeProvider>
        </ScenarioProvider>
    );
}

export default App;
