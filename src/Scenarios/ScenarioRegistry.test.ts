import { describe, expect, it } from 'vitest';
import { scenarioRegistry, type ScenarioDefinition } from './ScenarioRegistry';

function definition(name: string): ScenarioDefinition {
    return {
        name,
        createGlobalContext: () => ({ initialize: () => {}, asyncInitialize: async () => {}, toObject: () => ({}) }),
        panelMapping: () => null,
    };
}

describe('scenarioRegistry', () => {
    it('returns a registered scenario by name', () => {
        const registered = definition('RegistryTestScenario');
        scenarioRegistry.register(registered);
        expect(scenarioRegistry.has('RegistryTestScenario')).toBe(true);
        expect(scenarioRegistry.get('RegistryTestScenario')).toBe(registered);
    });

    it('names the registered scenarios when asked for an unknown one', () => {
        scenarioRegistry.register(definition('RegistryTestKnown'));
        expect(() => scenarioRegistry.get('RegistryTestMissing')).toThrow(/RegistryTestKnown/);
    });
});
