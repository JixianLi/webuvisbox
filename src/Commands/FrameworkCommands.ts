// ABOUTME: The framework's own commands: display mode and UI scale, the active panel (fit, collapse, close),
// ABOUTME: the layout (reset) and the shortcut list. Scenarios add theirs to the same registry.

import type { PanelLayouts } from '../Types/PanelLayouts';
import { DISPLAY_MODES, UI_SCALES, type DisplayMode } from '../Theme/DesignTokens';
import type { Command, CommandRegistry } from './CommandRegistry';

interface FrameworkCommandTargets {
    panelLayouts: () => PanelLayouts | undefined;
    mode: () => DisplayMode;
    setMode: (mode: DisplayMode) => void;
    uiScale: () => number;
    setUiScale: (uiScale: number) => void;
}

function nextScale(uiScale: number, direction: 1 | -1): number {
    const index = UI_SCALES.findIndex(scale => scale >= uiScale - 1e-6);
    const current = index === -1 ? UI_SCALES.length - 1 : index;
    return UI_SCALES[Math.min(UI_SCALES.length - 1, Math.max(0, current + direction))];
}

export function frameworkCommands(registry: CommandRegistry, targets: FrameworkCommandTargets): Command[] {
    return [
        { id: 'display.cycle_mode', label: 'Next display mode (bright, dark, neutral)', group: 'Display', shortcut: 'Alt+KeyM',
          run: () => targets.setMode(DISPLAY_MODES[(DISPLAY_MODES.indexOf(targets.mode()) + 1) % DISPLAY_MODES.length]) },
        { id: 'display.scale_up', label: 'Larger UI', group: 'Display', shortcut: 'Alt+Equal',
          run: () => targets.setUiScale(nextScale(targets.uiScale(), 1)) },
        { id: 'display.scale_down', label: 'Smaller UI', group: 'Display', shortcut: 'Alt+Minus',
          run: () => targets.setUiScale(nextScale(targets.uiScale(), -1)) },
        { id: 'display.scale_reset', label: 'UI at 100%', group: 'Display', shortcut: 'Alt+Digit0',
          run: () => targets.setUiScale(1) },
        { id: 'panel.fit', label: 'Fit panel to its content', group: 'Panel', shortcut: 'Alt+KeyF', isPanelCommand: true,
          run: panelId => registry.runPanelAction(panelId!, 'fit') },
        { id: 'panel.collapse', label: 'Collapse or expand panel', group: 'Panel', shortcut: 'Alt+KeyC', isPanelCommand: true,
          run: panelId => targets.panelLayouts()?.toggleCollapsed(panelId!) },
        { id: 'panel.close', label: 'Close panel', group: 'Panel', shortcut: 'Alt+KeyW', isPanelCommand: true,
          run: panelId => targets.panelLayouts()?.closePanel(panelId!) },
        { id: 'layout.reset', label: 'Reset layout', group: 'Layout', shortcut: 'Alt+Shift+KeyR',
          run: () => targets.panelLayouts()?.resetToDefault() },
        { id: 'help.shortcuts', label: 'Show keyboard shortcuts', group: 'Help', shortcut: 'Shift+Slash',
          run: () => registry.setShortcutsOpen(true) },
    ];
}
