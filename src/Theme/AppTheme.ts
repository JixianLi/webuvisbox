// ABOUTME: Builds the MUI theme of a display mode from the design tokens: palette, type, shapes and the component
// ABOUTME: overrides that give panels, menus and fields their look. Components read tokens as theme.tokens.

import { createTheme, type Theme } from '@mui/material/styles';
import { ChevronDown } from 'lucide-react';
import { createElement } from 'react';
import { MODE_TOKENS, SHAPE, TYPE, type DisplayMode, type ModeTokens } from './DesignTokens';

export interface ResolvedTokens extends Omit<ModeTokens, 'accentFill' | 'accentOnSurface' | 'controlPanels'> {
    mode: DisplayMode;
    accent: string;
    accentFill: string;
    accentOnSurface: string;
    // What a borderless panel (a main view) sits on: the canvas, or the surface in a mode with dark chrome.
    borderlessFill: string;
    uiScale: number;
    // A size in px at the current UI scale.
    px: (size: number) => number;
}

declare module '@mui/material/styles' {
    // controlPanelTheme: the theme of panels that are not scenes, where the mode gives them their own tokens.
    interface Theme { tokens: ResolvedTokens; controlPanelTheme?: Theme }
    interface ThemeOptions { tokens?: ResolvedTokens }
}

export function createAppTheme(mode: DisplayMode, accent: string, uiScale: number): Theme {
    const modeTokens = MODE_TOKENS[mode];
    const theme = themeFromTokens(modeTokens, mode, accent, uiScale);
    if (modeTokens.controlPanels) {
        theme.controlPanelTheme = themeFromTokens(modeTokens.controlPanels, mode, accent, uiScale);
    }
    return theme;
}

function themeFromTokens(modeTokens: ModeTokens, mode: DisplayMode, accent: string, uiScale: number): Theme {
    const { controlPanels: _controlPanels, ...ownTokens } = modeTokens;
    const px = (size: number) => Math.round(size * uiScale * 100) / 100;
    const tokens: ResolvedTokens = {
        ...ownTokens,
        mode,
        accent,
        accentFill: modeTokens.accentFill(accent),
        accentOnSurface: modeTokens.accentOnSurface(accent),
        borderlessFill: modeTokens.chrome ? modeTokens.surface : modeTokens.canvas,
        uiScale,
        px,
    };
    const SelectChevron = (props: { className?: string }) =>
        createElement(ChevronDown, { size: px(16), strokeWidth: 1.75, className: props.className, style: { right: px(8) } });

    return createTheme({
        tokens,
        palette: {
            mode: modeTokens.base,
            // Lines and text (outlined and text buttons, sliders, focus, checkboxes) need the accent's on-surface tint
            // for contrast; fills (contained buttons, switch tracks) take accentFill through their overrides below.
            primary: { main: tokens.accentOnSurface, contrastText: '#FFFFFF' },
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
                    body: { fontFeatureSettings: '"tnum", "cv11"', backgroundColor: modeTokens.canvas,
                            colorScheme: modeTokens.base, scrollbarColor: `${modeTokens.scrollbarThumb} transparent` },
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
                            '&.Mui-checked': { transform: `translateX(${px(14)}px)`, color: '#FFFFFF' },
                            '&.Mui-checked + .MuiSwitch-track': { opacity: 1, backgroundColor: tokens.accentFill },
                        },
                        '& .MuiSwitch-thumb': { width: px(16), height: px(16), boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' },
                        '& .MuiSwitch-track': { opacity: 1, borderRadius: px(10), backgroundColor: modeTokens.textMuted },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        variants: [{
                            props: { variant: 'contained', color: 'primary' },
                            style: {
                                backgroundColor: tokens.accentFill,
                                '&:hover': { backgroundColor: tokens.accentFill, filter: 'brightness(1.12)' },
                            },
                        }],
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
