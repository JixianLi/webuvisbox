import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import PresetLinearColormap from './PresetLinearColormap';
import VSUP from './VSUP';
import { OpacityMap } from './OpacityMap';
import { getTextureManager } from './TextureManager';

function hex(colormap: PresetLinearColormap, value: number): string {
    return colormap.getColorByValue(value).formatHex();
}

// Texel x of a texture's first row as [r, g, b, a].
function texel(texture: THREE.DataTexture, x: number): number[] {
    const data = texture.image.data as Uint16Array;
    return Array.from(data.slice(x * 4, x * 4 + 4), THREE.DataUtils.fromHalfFloat);
}

describe('PresetLinearColormap', () => {
    it('inverts by mirroring: the color at p moves to 1 - p', () => {
        const colormap = new PresetLinearColormap();
        colormap.setControlPoints([0, 0.2, 1], [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
        colormap.invert();
        expect(colormap.colorControlPoints).toEqual([0, 0.8, 1]);
        expect(hex(colormap, 0.8)).toBe('#00ff00');
        expect(hex(colormap, 0)).toBe('#0000ff');
    });

    it('round-trips through toObject and fromObject', () => {
        const colormap = new PresetLinearColormap('Viridis (matplotlib)');
        colormap.addColorControlPoint(0.33);
        const copy = PresetLinearColormap.fromObject(colormap.toObject());
        expect(copy.colorControlPoints).toEqual(colormap.colorControlPoints);
        expect(hex(copy, 0.6)).toBe(hex(colormap, 0.6));
    });
});

describe('VSUP', () => {
    it('follows edits of its color points', () => {
        const vsup = new VSUP(2);
        const before = vsup.getColorForTexture(0, 1).formatHex();
        vsup.setColorControlPoint(0, 0, [1, 0, 0]);
        expect(vsup.getColorForTexture(0, 1).formatHex()).not.toBe(before);
    });

    it('follows a change of depth for colors it had cached', () => {
        // Half certain at value 0.3: depth 1 fades the color at 0.3; depth 3 falls in the coarser bin colored at 0.
        const vsup = new VSUP(1);
        const atDepthOne = vsup.getColorForTexture(0.3, 0.5).formatHex();
        vsup.setDepth(3);
        expect(vsup.getColorForTexture(0.3, 0.5).formatHex()).not.toBe(atDepthOne);
    });
});

describe('TextureManager', () => {
    it('stores colors as linear light and labels the texture so', () => {
        const manager = getTextureManager();
        const colormap = new PresetLinearColormap();
        colormap.setControlPoints([0, 1], [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5]]);
        manager.registerColormap('test-gray', colormap);
        const texture = manager.getTexture('test-gray', undefined, 4, 1)!;

        expect(texture.colorSpace).toBe(THREE.LinearSRGBColorSpace);
        const sRGBGray = Math.round(0.5 * 255) / 255;
        // The sRGB transfer function (IEC 61966-2-1): ((c + 0.055) / 1.055) ^ 2.4 above 0.04045.
        expect(texel(texture, 0)[0]).toBeCloseTo(((sRGBGray + 0.055) / 1.055) ** 2.4, 2);
        manager.dispose('test-gray', undefined, 4, 1);
    });

    it('rewrites the texture when a map is edited', () => {
        const manager = getTextureManager();
        const colormap = new PresetLinearColormap();
        const opacityMap = new OpacityMap([0, 1], [1, 1]);
        manager.registerColormap('test-edit', colormap);
        manager.registerOpacityMap('test-edit', opacityMap);
        const texture = manager.getTexture('test-edit', 'test-edit', 4, 1)!;

        opacityMap.setOpacityControlPoint(0, 0, 0.25);
        expect(texel(texture, 0)[3]).toBeCloseTo(0.25, 2);
        manager.dispose('test-edit', 'test-edit', 4, 1);
    });
});
