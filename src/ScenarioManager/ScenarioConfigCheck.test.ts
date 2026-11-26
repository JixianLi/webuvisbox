import { describe, expect, it } from 'vitest';
import { checkConfig } from './ScenarioConfigCheck';
import { scenarioRegistry } from '../Scenarios/ScenarioRegistry';

scenarioRegistry.register({
    name: 'ConfigCheckScenario',
    createGlobalContext: () => ({ initialize: () => {}, asyncInitialize: async () => {}, toObject: () => ({}) }),
    panelMapping: () => null,
});

function config(overrides: Record<string, unknown> = {}) {
    return {
        name: 'ConfigCheckScenario',
        panel_layouts: { default_layouts: { xl: [{ i: 'Viewport', x: 0, y: 0, w: 12, h: 8 }] } },
        ...overrides,
    };
}

describe('checkConfig', () => {
    it('accepts a config with only a name and one layout', () => {
        expect(() => checkConfig(config())).not.toThrow();
    });

    it.each([
        ['not an object', 'Viewport', /not a JSON object/],
        ['no name', { panel_layouts: {} }, /no "name"/],
        ['an unregistered name', config({ name: 'Nowhere' }), /No scenario named "Nowhere"/],
        ['no layouts', config({ panel_layouts: {} }), /no panel_layouts.default_layouts/],
        ['a panel without geometry', config({ panel_layouts: { default_layouts: { xl: [{ i: 'Viewport' }] } } }), /numbers "x", "y", "w", "h"/],
        ['layouts for none of the breakpoints', config({ panel_layouts: { default_layouts: { md: [] } } }), /no layout for any of the default breakpoints/],
        ['MUI\'s name for the bright mode', config({ appearance: { default_mode: 'light' } }), /must be one of bright, dark, neutral/],
        ['a UI scale out of range', config({ appearance: { ui_scale: 4 } }), /from 0.85 to 1.75/],
        ['an accent that is not a color', config({ appearance: { accent: 'red; background: url(x)' } }), /not a CSS color/],
    ])('rejects %s', (_, value, message) => {
        expect(() => checkConfig(value)).toThrow(message);
    });
});
