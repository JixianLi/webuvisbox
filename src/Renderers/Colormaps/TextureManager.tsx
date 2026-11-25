import * as THREE from 'three';
import { autorun, makeAutoObservable, type IReactionDisposer } from 'mobx';
import PresetLinearColormap from './PresetLinearColormap';
import { OpacityMap } from './OpacityMap';
import VSUP from './VSUP';
import { announceTextureUpdate } from './TextureUpdates';

type Colormap = PresetLinearColormap | VSUP;

class TextureManager {
    private static instance: TextureManager;

    private colormaps = new Map<string, Colormap>();
    private opacityMaps = new Map<string, OpacityMap>();
    private textures = new Map<string, THREE.DataTexture>();
    private disposers = new Map<string, IReactionDisposer>();

    // The registered maps are observable, so a texture's autorun follows a map registered again under its name. The
    // textures and autorun disposers are a plain cache: observable, the autorun that creates a texture would write a
    // map it reads, and run twice.
    private constructor() {
        makeAutoObservable<this, 'textures' | 'disposers'>(this, { textures: false, disposers: false });
    }

    public static getInstance(): TextureManager {
        if (!TextureManager.instance) {
            TextureManager.instance = new TextureManager();
        }
        return TextureManager.instance;
    }

    public registerColormap(name: string, colormap: Colormap): void {
        this.colormaps.set(name, colormap);
    }

    public registerOpacityMap(name: string, opacityMap: OpacityMap): void {
        this.opacityMaps.set(name, opacityMap);
    }

    public getColormap(name: string): Colormap | undefined {
        return this.colormaps.get(name);
    }

    public getOpacityMap(name: string): OpacityMap | undefined {
        return this.opacityMaps.get(name);
    }

    private getTextureKey(colormapName: string, opacityMapName?: string, width?: number, height?: number): string {
        return `${colormapName}-${opacityMapName || 'no-opacity'}-${width}x${height}`;
    }

    public getTexture(colormapName: string, opacityMapName?: string, width: number = 256, height: number = 1): THREE.DataTexture | undefined {
        const key = this.getTextureKey(colormapName, opacityMapName, width, height);
        if (!this.textures.has(key)) {
            this.createTexture(colormapName, opacityMapName, width, height);
        }
        return this.textures.get(key);
    }

    private createTexture(colormapName: string, opacityMapName: string | undefined, width: number, height: number): void {
        const key = this.getTextureKey(colormapName, opacityMapName, width, height);

        if (this.disposers.has(key)) {
            this.disposers.get(key)!();
        }
        if (!this.colormaps.get(colormapName)) {
            console.error(`Colormap '${colormapName}' not registered.`);
            return;
        }

        // Uploaded as 16-bit floats: about three significant digits at any magnitude, so opacities well below 0.1
        // stay distinct (8 bits would step by 1/255 ≈ 0.004), and, unlike 32-bit floats, linearly filterable in
        // WebGL2 without an extension.
        const texture = new THREE.DataTexture(new Uint16Array(width * height * 4), width, height, THREE.RGBAFormat,
                                              THREE.HalfFloatType);
        texture.internalFormat = "RGBA16F";
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.textures.set(key, texture);

        // Both maps are looked up on every fill, so registering a new map under the same name (a scenario opened
        // again creates new ones) updates the texture rather than leaving it tied to the old map.
        const fill = () => {
            const colormap = this.colormaps.get(colormapName);
            const opacityMap = opacityMapName ? this.opacityMaps.get(opacityMapName) : undefined;
            if (!colormap) return;
            const textureData = new Float32Array(width * height * 4);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const x_norm = width === 1 ? 0 : x / (width - 1);
                    const y_norm = height === 1 ? 0 : y / (height - 1);

                    const color = colormap.getColorForTexture(x_norm, y_norm);

                    const idx = (y * width + x) * 4;
                    textureData[idx] = color.r / 255;
                    textureData[idx + 1] = color.g / 255;
                    textureData[idx + 2] = color.b / 255;
                    textureData[idx + 3] = opacityMap ? opacityMap.getOpacityFromControlPoints(x_norm) : 1.0;
                }
            }
            texture.image.data = Uint16Array.from(textureData, THREE.DataUtils.toHalfFloat);
            texture.needsUpdate = true;
            // Rewritten in place, which React never sees: announce it, so canvases drawing on demand redraw.
            announceTextureUpdate(texture);
        };

        // Filled now, so getTexture returns a ready texture even when called inside a MobX action (getTexture is one),
        // where a new autorun's first run waits until the action ends; the autorun then keeps it current as the maps
        // are edited or registered again.
        fill();
        this.disposers.set(key, autorun(fill));
    }

    public dispose(colormapName: string, opacityMapName?: string, width: number = 256, height: number = 1): void {
        const key = this.getTextureKey(colormapName, opacityMapName, width, height);
        if (this.textures.has(key)) {
            this.textures.get(key)!.dispose();
            this.textures.delete(key);
        }
        if (this.disposers.has(key)) {
            this.disposers.get(key)!();
            this.disposers.delete(key);
        }
    }

    public disposeAll(): void {
        for (const texture of this.textures.values()) {
            texture.dispose();
        }
        this.textures.clear();
        for (const disposer of this.disposers.values()) {
            disposer();
        }
        this.disposers.clear();
    }
}


export function getTextureManager(): TextureManager {
    return TextureManager.getInstance();
}

export default getTextureManager;
