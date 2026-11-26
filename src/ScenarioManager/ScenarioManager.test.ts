import { describe, expect, it, vi } from 'vitest';
import { loadScenario, ScenarioManager } from './ScenarioManager';
import { scenarioRegistry } from '../Scenarios/ScenarioRegistry';
import type { GlobalContext } from '../Types/GlobalContext';

// A context whose asyncInitialize finishes (or fails) when the test says so.
class ControlledContext implements GlobalContext {
    finish!: () => void;
    fail!: (error: Error) => void;
    initialized = new Promise<void>((resolve, reject) => { this.finish = resolve; this.fail = reject; });
    dispose = vi.fn();
    initialize() {}
    asyncInitialize() { return this.initialized; }
    toObject() { return {}; }
}

const created: ControlledContext[] = [];
for (const name of ['LifecycleFirst', 'LifecycleSecond']) {
    scenarioRegistry.register({
        name,
        createGlobalContext: () => {
            const context = new ControlledContext();
            created.push(context);
            return context;
        },
        panelMapping: () => null,
    });
}

function config(name: string) {
    return { name, panel_layouts: { default_layouts: { xl: [{ i: 'Viewport', x: 0, y: 0, w: 12, h: 8 }] } } };
}

async function loaded(manager: ScenarioManager, name: string) {
    const load = loadScenario(manager, config(name));
    created.at(-1)!.finish();
    await load;
}

describe('ScenarioManager', () => {
    it('keeps the running scenario until the new one has initialized, then disposes the old context', async () => {
        const manager = new ScenarioManager();
        await loaded(manager, 'LifecycleFirst');
        const first = manager.globalContext as ControlledContext;

        const load = loadScenario(manager, config('LifecycleSecond'));
        expect(manager.name).toBe('LifecycleFirst');
        created.at(-1)!.finish();
        await load;

        expect(manager.name).toBe('LifecycleSecond');
        expect(first.dispose).toHaveBeenCalledOnce();
    });

    it('leaves the running scenario as it was when a load fails during initialization', async () => {
        const manager = new ScenarioManager();
        await loaded(manager, 'LifecycleFirst');
        const generation = manager.generation;

        const load = loadScenario(manager, config('LifecycleSecond'));
        const failing = created.at(-1)!;
        failing.fail(new Error('the data could not be read'));
        await load;

        expect(manager.name).toBe('LifecycleFirst');
        expect(manager.generation).toBe(generation);
        expect(manager.loadError).toBe('the data could not be read');
        expect(failing.dispose).toHaveBeenCalledOnce();
    });

    it('swaps in the latest load when an earlier one finishes after it, and disposes the earlier one', async () => {
        const manager = new ScenarioManager();
        const earlier = loadScenario(manager, config('LifecycleFirst'));
        const earlierContext = created.at(-1)!;
        const later = loadScenario(manager, config('LifecycleSecond'));
        created.at(-1)!.finish();
        await later;
        earlierContext.finish();
        await earlier;

        expect(manager.name).toBe('LifecycleSecond');
        expect(earlierContext.dispose).toHaveBeenCalledOnce();
    });

    it('rejects a bad config without touching the running scenario', async () => {
        const manager = new ScenarioManager();
        await loaded(manager, 'LifecycleFirst');
        await loadScenario(manager, { ...config('LifecycleSecond'), appearance: { default_mode: 'light' } });
        expect(manager.name).toBe('LifecycleFirst');
        expect(manager.loadError).toMatch(/default_mode/);
    });
});
