// ABOUTME: Builds the MUI theme of a display mode from the design tokens: palette, type, shapes and the component
// ABOUTME: overrides that give panels, menus and fields their look. Components read tokens as theme.tokens.

import { createTheme, type Theme } from '@mui/material/styles';
import { ChevronDown } from 'lucide-react';
import { createElement } from 'react';
import { MODE_TOKENS, SHAPE, TYPE, type DisplayMode, type ModeTokens } from './DesignTokens';

export interface ResolvedTokens extends Omit<ModeTokens, 'accentFill' | 'accentOnSurface'> {
    mode: DisplayMode;
    accent: string;
    accentFill: string;
    accentOnSurface: string;
    uiScale: number;
    // A size in px at the current UI scale.
    px: (size: number) => number;
}

declare module '@mui/material/styles' {
    interface Theme { tokens: ResolvedTokens }
    interface ThemeOptions { tokens?: ResolvedTokens }
}

export function createAppTheme(mode: DisplayMode, accent: string, uiScale: number): Theme {
    const modeTokens = MODE_TOKENS[mode];
    const px = (size: number) => Math.round(size * uiScale * 100) / 100;
    const tokens: ResolvedTokens = {
        ...modeTokens,
        mode,
        accent,
        accentFill: modeTokens.accentFill(accent),
        accentOnSurface: modeTokens.accentOnSurface(accent),
        uiScale,
        px,
    };
    const SelectChevron = (props: { className?: string }) =>
        createElement(ChevronDown, { size: px(16), strokeWidth: 1.75, className: props.className, style: { right: px(8) } });
    const accentText = mode === 'neutral' ? '#1A1A1A' : '#FFFFFF';

    return createTheme({
        tokens,
        palette: {
            mode: modeTokens.base,
            primary: { main: tokens.accentFill, contrastText: accentText },
            background: { default: modeTokens.canvas, paper: modeTokens.surface },
            text: { primary: modeTokens.text, secondary: modeTokens.textSecondary, disabled: modeTokens.textMuted },
            divider: modeTokens.border,
        },
        typography: {
            fontFamily: TYPE.family,
            fontSize: px(TYPE.baseSize),
            button: { textTransform: 'none', fontWeight: 500 },
        },
        spacing: px(8),
        shape: { borderRadius: px(SHAPE.controlRadius) },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: { fontFeatureSettings: '"tnum", "cv11"', backgroundColor: modeTokens.canvas },
                },
            },
            MuiPaper: {
                defaultProps: { elevation: 0 },
                styleOverrides: { root: { backgroundImage: 'none' } },
            },
            MuiAppBar: { defaultProps: { elevation: 0 } },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        backgroundColor: modeTokens.surfaceRaised,
                        border: `1px solid ${modeTokens.border}`,
                        boxShadow: modeTokens.shadowRaised,
                        borderRadius: px(8),
                        marginTop: px(4),
                    },
                    list: { padding: px(4) },
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        fontSize: px(13),
                        borderRadius: px(5),
                        minHeight: px(30),
                        '&.Mui-selected': { backgroundColor: modeTokens.controlFill },
                    },
                },
            },
            MuiTextField: { defaultProps: { size: 'small' } },
            MuiSelect: { defaultProps: { IconComponent: SelectChevron } },
            MuiInputLabel: {
                styleOverrides: {
                    root: { fontSize: px(13), color: modeTokens.textSecondary },
                    shrink: { fontSize: px(13) },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        fontSize: px(13),
                        backgroundColor: modeTokens.controlFill,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: modeTokens.border },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: tokens.accentOnSurface, borderWidth: 1,
                        },
                    },
                },
            },
            MuiFormControlLabel: {
                styleOverrides: { root: { marginLeft: 0 }, label: { fontSize: px(13), color: modeTokens.textSecondary } },
            },
            MuiSwitch: {
                // Geometry is set from the root, with nested selectors: MUI's own size variants (size="small")
                // style the switch base and thumb from the root too, and would win over the slot overrides.
                styleOverrides: {
                    root: {
                        width: px(34), height: px(20), padding: px(0), margin: `0 ${px(10)}px 0 0`, borderRadius: px(10),
                        '& .MuiSwitch-switchBase': {
                            padding: px(2),
                            color: '#FFFFFF',
                            '&.Mui-checked': { transform: `translateX(${px(14)}px)`, color: accentText },
                            '&.Mui-checked + .MuiSwitch-track': { opacity: 1, backgroundColor: tokens.accentFill },
                        },
                        '& .MuiSwitch-thumb': { width: px(16), height: px(16), boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' },
                        '& .MuiSwitch-track': { opacity: 1, borderRadius: px(10), backgroundColor: modeTokens.textMuted },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: { root: { borderRadius: px(6) } },
            },
            MuiDivider: {
                styleOverrides: { root: { borderColor: modeTokens.border, fontSize: px(11), color: modeTokens.textMuted } },
            },
            MuiTypography: {
                styleOverrides: { body2: { fontSize: px(13) } },
            },
        },
    });
}
