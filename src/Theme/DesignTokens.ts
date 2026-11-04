// ABOUTME: Design tokens: the named colors, type, shapes and glass of each display mode (bright, dark, neutral).
// ABOUTME: Components read tokens through the MUI theme (createAppTheme); a scenario may override the accent.

export type DisplayMode = 'bright' | 'dark' | 'neutral';
export const DISPLAY_MODES: DisplayMode[] = ['bright', 'dark', 'neutral'];

// University of Utah brand colors toolkit (brand.utah.edu, 2023): Utah Red is the core color for digital use.
export const UTAH_RED = '#BE0000';

export interface ModeTokens {
    // MUI's palette.mode the mode is built on: it picks MUI's defaults for anything the tokens leave out.
    base: 'light' | 'dark';
    canvas: string;           // behind the panels
    surface: string;          // panels
    surfaceRaised: string;    // menus, popovers
    controlFill: string;      // text fields, selects
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    // The navbar: 'surface' blends with the panels, 'accent' fills it with the accent (the brand bar).
    navbar: 'surface' | 'accent';
    // Accent as a fill (switch, selection; white text on it) and as a line or text on the surface (focus ring,
    // links), where a dark surface needs a lighter tint to keep 3:1 contrast.
    accentFill: (accent: string) => string;
    accentOnSurface: (accent: string) => string;
    glass: { fill: string; blur: number; saturate: number; edge: string; highlight: string };
    shadowRaised: string;
}

export const MODE_TOKENS: Record<DisplayMode, ModeTokens> = {
    bright: {
        base: 'light',
        canvas: '#EEF0F0',
        surface: '#FFFFFF',
        surfaceRaised: '#FFFFFF',
        controlFill: '#F3F4F5',
        border: 'rgba(16, 24, 32, 0.10)',
        text: '#16181A',
        textSecondary: '#545A60',
        textMuted: '#868C92',
        navbar: 'accent',
        accentFill: accent => accent,
        accentOnSurface: accent => accent,
        glass: { fill: 'rgba(255, 255, 255, 0.70)', blur: 24, saturate: 1.4, edge: 'rgba(255, 255, 255, 0.70)',
                 highlight: 'rgba(255, 255, 255, 0.55)' },
        shadowRaised: '0 10px 30px rgba(16, 24, 32, 0.14), 0 1px 3px rgba(16, 24, 32, 0.08)',
    },
    dark: {
        base: 'dark',
        canvas: '#232428',
        surface: '#2C2D32',
        surfaceRaised: '#36373D',
        controlFill: '#35363C',
        border: 'rgba(255, 255, 255, 0.08)',
        text: '#ECEDEF',
        textSecondary: '#A9ADB4',
        textMuted: '#7D828A',
        navbar: 'surface',
        accentFill: accent => accent,
        accentOnSurface: () => '#E5484D',
        glass: { fill: 'rgba(44, 45, 50, 0.66)', blur: 24, saturate: 1.3, edge: 'rgba(255, 255, 255, 0.10)',
                 highlight: 'rgba(255, 255, 255, 0.10)' },
        shadowRaised: '0 12px 32px rgba(0, 0, 0, 0.40), 0 1px 3px rgba(0, 0, 0, 0.30)',
    },
    // For judging color: every gray is hue-free (R = G = B), no accent near the content, glass without saturation.
    neutral: {
        base: 'dark',
        canvas: '#4A4A4A',
        surface: '#545454',
        surfaceRaised: '#5E5E5E',
        controlFill: '#5C5C5C',
        border: 'rgba(255, 255, 255, 0.10)',
        text: '#F2F2F2',
        textSecondary: '#C8C8C8',
        textMuted: '#A0A0A0',
        navbar: 'surface',
        accentFill: () => '#E0E0E0',
        accentOnSurface: () => '#E0E0E0',
        glass: { fill: 'rgba(84, 84, 84, 0.70)', blur: 24, saturate: 1.0, edge: 'rgba(255, 255, 255, 0.12)',
                 highlight: 'rgba(255, 255, 255, 0.10)' },
        shadowRaised: '0 12px 32px rgba(0, 0, 0, 0.30), 0 1px 3px rgba(0, 0, 0, 0.25)',
    },
};

export const TYPE = {
    family: '"Inter Variable", Inter, system-ui, sans-serif',
    baseSize: 14,
    panelTitleSize: 13,
    navbarTitleSize: 15,
};

// UI scale: one factor over every size (type, controls, headers, spacing), for larger screenshots or projection.
// The render itself is unaffected (its resolution is the renderer's own setting).
export const UI_SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

export const SHAPE = {
    panelRadius: 10,
    controlRadius: 7,
    navbarHeight: 44,
    panelHeaderHeight: 34,
    panelGap: 8,
    inspectorWidth: 340,
};

export interface Appearance {
    accent: string;
    defaultMode?: DisplayMode;
    uiScale: number;
}

// A scenario's JSON may set these under "appearance" (accent, default_mode, ui_scale).
export const DEFAULT_APPEARANCE: Appearance = { accent: UTAH_RED, uiScale: 1 };
