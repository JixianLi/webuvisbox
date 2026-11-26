import { describe, expect, it } from 'vitest';
import { DEFAULT_BREAKPOINTS, PanelLayoutManager } from './PanelLayoutManager';
import type { AppLayouts } from '../Types/PanelLayouts';

const LAYOUTS: AppLayouts = {
    xl: [
        { i: 'Viewport', x: 0, y: 0, w: 16, h: 10, visible: true },
        { i: 'Settings', x: 16, y: 0, w: 8, h: 10, visible: false },
    ],
};

function panel(manager: PanelLayoutManager, panelId: string) {
    return manager.currentLayouts[manager.currentBreakpoint].find(item => item.i === panelId)!;
}

describe('PanelLayoutManager', () => {
    it('uses the default breakpoints when the config gives none', () => {
        const manager = new PanelLayoutManager(LAYOUTS);
        expect(manager.breakpoints).toEqual(DEFAULT_BREAKPOINTS);
    });

    it('gives a breakpoint without a layout the layout of the nearest wider one', () => {
        const manager = new PanelLayoutManager({ xl: LAYOUTS.xl, sm: [{ i: 'Viewport', x: 0, y: 0, w: 4, h: 6, visible: true }] },
                                               { xl: 1440, lg: 800, sm: 0 });
        expect(manager.defaultLayouts.lg.map(item => item.w)).toEqual([16, 8]);
        expect(manager.defaultLayouts.sm.map(item => item.w)).toEqual([4]);
    });

    it('starts at the widest breakpoint, whatever it is named', () => {
        const manager = new PanelLayoutManager({ desktop: LAYOUTS.xl }, { desktop: 1000, phone: 0 });
        expect(manager.currentBreakpoint).toBe('desktop');
        expect(manager.currentLayouts.phone).toHaveLength(2);
    });

    it('takes a hidden panel out of the grid and reopens it where its layout puts it', () => {
        const manager = new PanelLayoutManager(LAYOUTS);
        expect(panel(manager, 'Settings')).toMatchObject({ w: 0, h: 0, visible: false, static: true });
        manager.restorePanel('Settings');
        expect(panel(manager, 'Settings')).toMatchObject({ x: 16, w: 8, h: 10, visible: true });
    });

    it('keeps hidden panels out of the grid after a reset', () => {
        const manager = new PanelLayoutManager(LAYOUTS);
        manager.restorePanel('Settings');
        manager.resetToDefault();
        expect(panel(manager, 'Settings')).toMatchObject({ w: 0, h: 0, visible: false });
        manager.restorePanel('Settings');
        expect(panel(manager, 'Settings')).toMatchObject({ w: 8, h: 10, visible: true });
    });

    it('collapses a panel to its title row and restores its height', () => {
        const manager = new PanelLayoutManager(LAYOUTS);
        manager.toggleCollapsed('Viewport');
        expect(panel(manager, 'Viewport').collapsed).toBe(true);
        manager.toggleCollapsed('Viewport');
        expect(panel(manager, 'Viewport')).toMatchObject({ collapsed: false, h: 10 });
    });
});
