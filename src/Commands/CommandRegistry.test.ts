import { describe, expect, it, vi } from 'vitest';
import { CommandRegistry, type Command } from './CommandRegistry';

function command(id: string, run = vi.fn()): Command {
    return { id, label: id, group: 'Test', run };
}

describe('CommandRegistry', () => {
    it('unregisters a command with the function register returned', () => {
        const registry = new CommandRegistry();
        const unregister = registry.register(command('test.command'));
        unregister();
        expect(registry.commands.has('test.command')).toBe(false);
    });

    it('keeps a newer command registered under the same id when the older one unregisters', () => {
        const registry = new CommandRegistry();
        const unregisterOlder = registry.register(command('test.command'));
        const newer = command('test.command');
        registry.register(newer);
        unregisterOlder();
        registry.run('test.command');
        expect(newer.run).toHaveBeenCalledOnce();
    });

    it('removes a panel action with the function setPanelAction returned', () => {
        const registry = new CommandRegistry();
        const fit = vi.fn();
        const remove = registry.setPanelAction('Viewport', 'fit', fit);
        remove();
        registry.runPanelAction('Viewport', 'fit');
        expect(fit).not.toHaveBeenCalled();
    });

    it('clears the active panel when the pointer leaves it, but not one that became active since', () => {
        const registry = new CommandRegistry();
        registry.setActivePanel('Viewport');
        registry.setActivePanel('Settings');
        registry.clearActivePanel('Viewport');
        expect(registry.activePanelId).toBe('Settings');
        registry.clearActivePanel('Settings');
        expect(registry.activePanelId).toBeNull();
    });
});
