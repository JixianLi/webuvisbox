import { describe, expect, it } from 'vitest';
import { TornadoEnsembleGlobalContext } from './TornadoEnsembleGlobalContext';
import { generateEnsemble, SAMPLE_COUNT } from './TornadoFlow';

describe('TornadoEnsembleGlobalContext', () => {
    it('gets from its data server the ensemble the settings describe, decoded from base64', async () => {
        const context = new TornadoEnsembleGlobalContext();
        context.initialize({ member_count: 10, variability_growth: 0.02, seed: 4 });
        await context.asyncInitialize();

        const expected = generateEnsemble(10, 0.02, 4);
        expect(context.ensemble.paths).toHaveLength(10);
        expect(context.ensemble.paths[3]).toEqual(expected.paths[3]);
        expect(context.ensemble.spread).toEqual(expected.spread);
        expect(context.ensemble.uncertaintyTube.indices.length).toBeGreaterThan(0);
        expect(context.ensemble.paths[0].length).toBe(SAMPLE_COUNT * 3);
    });

    it('keeps the answer to the latest query when an earlier one finishes later', async () => {
        const context = new TornadoEnsembleGlobalContext();
        context.initialize({ member_count: 10 });
        const first = context.requestEnsemble();
        context.setMemberCount(12);
        const second = context.requestEnsemble();
        await Promise.all([first, second]);
        expect(context.ensemble.paths).toHaveLength(12);
    });

    it('drops answers that arrive after it was disposed', async () => {
        const context = new TornadoEnsembleGlobalContext();
        context.initialize({ member_count: 10 });
        const pending = context.requestEnsemble();
        context.dispose();
        await pending;
        expect(context.ensemble).toBeUndefined();
    });

    it('stores its settings, seed included, so a downloaded config reopens the same ensemble', () => {
        const context = new TornadoEnsembleGlobalContext();
        context.initialize({ member_count: 20, seed: 7, color_mode: 'time' });
        const copy = new TornadoEnsembleGlobalContext();
        copy.initialize(context.toObject());
        expect(copy.toObject()).toEqual(context.toObject());
        expect(copy.seed).toBe(7);
    });
});
