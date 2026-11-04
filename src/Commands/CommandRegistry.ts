// ABOUTME: Command registry: named actions with optional keyboard shortcuts, registered by the framework and by
// ABOUTME: scenarios, run from keys, buttons or a list. Panel commands act on the active panel (last hovered or focused).

import { makeAutoObservable } from 'mobx';

// A shortcut is modifiers plus a KeyboardEvent.code, written "Alt+KeyF", "Alt+Shift+KeyR", "Shift+Slash".
// event.code names the physical key, so Alt on macOS (which turns "f" into "ƒ" in event.key) still matches.
export type Shortcut = string;

export interface Command {
    id: string;
    label: string;
    group: string;
    shortcut?: Shortcut;
    // A panel command runs on a panel: the one given, or the active panel.
    run: (panelId?: string) => void;
    isPanelCommand?: boolean;
}

interface ParsedShortcut { code: string; alt: boolean; shift: boolean; ctrl: boolean; meta: boolean }

function parseShortcut(shortcut: Shortcut): ParsedShortcut {
    const parts = shortcut.split('+');
    return {
        code: parts[parts.length - 1],
        alt: parts.includes('Alt'),
        shift: parts.includes('Shift'),
        ctrl: parts.includes('Ctrl'),
        meta: parts.includes('Meta'),
    };
}

const KEY_LABELS: Record<string, string> = {
    Equal: '=', Minus: '−', Slash: '/', Digit0: '0', Escape: 'Esc',
};
const IS_MAC = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

export function shortcutLabel(shortcut: Shortcut): string {
    const parsed = parseShortcut(shortcut);
    const key = KEY_LABELS[parsed.code] ?? parsed.code.replace(/^Key|^Digit/, '');
    const modifiers = [
        parsed.ctrl ? (IS_MAC ? '⌃' : 'Ctrl+') : '',
        parsed.alt ? (IS_MAC ? '⌥' : 'Alt+') : '',
        parsed.shift ? (IS_MAC ? '⇧' : 'Shift+') : '',
        parsed.meta ? (IS_MAC ? '⌘' : 'Win+') : '',
    ];
    return modifiers.join('') + key;
}

function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export class CommandRegistry {
    commands: Map<string, Command> = new Map();
    activePanelId: string | null = null;
    shortcutsOpen: boolean = false;
    // What a panel does for a panel command it implements itself (fit measures its own content): panel -> action -> run.
    panelActions: Map<string, Map<string, () => void>> = new Map();

    constructor() {
        makeAutoObservable(this, { handleKeyDown: false });
    }

    // Returns the unregister function, for a React effect's cleanup.
    register(command: Command): () => void {
        this.commands.set(command.id, command);
        return () => {
            if (this.commands.get(command.id) === command) {
                this.commands.delete(command.id);
            }
        };
    }

    setPanelAction(panelId: string, action: string, run: () => void): () => void {
        const actions = this.panelActions.get(panelId) ?? new Map();
        actions.set(action, run);
        this.panelActions.set(panelId, actions);
        return () => {
            if (actions.get(action) === run) {
                actions.delete(action);
            }
        };
    }

    runPanelAction(panelId: string, action: string) {
        this.panelActions.get(panelId)?.get(action)?.();
    }

    setShortcutsOpen(open: boolean) {
        this.shortcutsOpen = open;
    }

    setActivePanel(panelId: string | null) {
        this.activePanelId = panelId;
    }

    run(id: string, panelId?: string) {
        const command = this.commands.get(id);
        if (!command) {
            return;
        }
        if (command.isPanelCommand) {
            const target = panelId ?? this.activePanelId;
            if (target) {
                command.run(target);
            }
        } else {
            command.run();
        }
    }

    shortcutOf(id: string): Shortcut | undefined {
        return this.commands.get(id)?.shortcut;
    }

    // Shortcuts with no modifier other than Shift are ignored while typing in a field, so they never eat text.
    handleKeyDown = (event: KeyboardEvent) => {
        for (const command of this.commands.values()) {
            if (!command.shortcut) {
                continue;
            }
            const parsed = parseShortcut(command.shortcut);
            const matches = parsed.code === event.code && parsed.alt === event.altKey && parsed.shift === event.shiftKey
                && parsed.ctrl === event.ctrlKey && parsed.meta === event.metaKey;
            if (!matches) {
                continue;
            }
            const plainKey = !parsed.alt && !parsed.ctrl && !parsed.meta;
            if (plainKey && isTyping(event.target)) {
                return;
            }
            event.preventDefault();
            this.run(command.id);
            return;
        }
    };
}

export const commandRegistry = new CommandRegistry();
