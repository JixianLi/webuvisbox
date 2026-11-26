import { describe, expect, it, vi } from 'vitest';
import { UncertainTerrainGlobalContext } from './UncertainTerrainGlobalContext';

describe('UncertainTerrainGlobalContext', () => {
    it('stores its settings, seed included, so a downloaded config reopens the same terrain', () => {
        const context = new UncertainTerrainGlobalContext();
        context.initialize({ member_count: 12, seed_offset: 3, encoding: 'spread', wind_color: [255, 128, 0], wind_glyph_scale: 2 });
        const copy = new UncertainTerrainGlobalContext();
        copy.initialize(context.toObject());
        expect(copy.toObject()).toEqual(context.toObject());
        expect(copy.seedOffset).toBe(3);
    });

    it('falls back to the default for a glyph scale out of range or an unknown encoding', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const context = new UncertainTerrainGlobalContext();
        context.initialize({ wind_glyph_scale: 50, encoding: 'height' as never });
        expect(context.windGlyphScale).toBe(1);
        expect(context.encoding).toBe('vsup');
        warn.mockRestore();
    });
});
