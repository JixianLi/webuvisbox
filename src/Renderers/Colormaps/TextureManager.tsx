import * as THREE from 'three';
import { autorun, makeAutoObservable, type IReactionDisposer } from 'mobx';
import PresetLinearColormap from './PresetLinearColormap';
import { OpacityMap } from './OpacityMap';
import VSUP from './VSUP';

type Colormap = PresetLinearColormap | VSUP;

class TextureManager {
    private static instance: TextureManager;

    private colormaps = new Map<string, Colormap>();
    private opacityMaps = new Map<string, OpacityMap>();
    private textures = new Map<string, THREE.DataTexture>();
    private disposers = new Map<string, IReactionDisposer>();

    private constructor() {
        makeAutoObservable(this);
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
        const opacityMap = opacityMapName ? this.opacityMaps.get(opacityMapName) : undefined;

        const key = this.getTextureKey(colormapName, opacityMapName, width, height);

        if (this.disposers.has(key)) {
            this.disposers.get(key)!();
        }

        const disposer = autorun(() => {
            const textureData = new Float32Array(width * height * 4);
            const colormap = this.colormaps.get(colormapName);
            if (!colormap) {
                console.error(`Colormap '${colormapName}' not registered.`);
                return;
            }

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const x_norm = width === 1 ? 0 : x / (width - 1);
                    const y_norm = height === 1 ? 0 : y / (height - 1);

                    const color = colormap.getColorForTexture(x_norm, y_norm);

                    const idx = (y * width + x) * 4;
                    textureData[idx] = color.r / 255;
                    textureData[idx + 1] = color.g / 255;
                    textureData[idx + 2] = color.b / 255;

                    if (opacityMap) {
                        const opacity = opacityMap.getOpacityFromControlPoints(x_norm);
                        textureData[idx + 3] = opacity;
                    } else {
                        textureData[idx + 3] = 1.0;
                    }
                }
            }

            let texture = this.textures.get(key);
            if (!texture) {
                texture = new THREE.DataTexture(
                    textureData,
                    width,
                    height,
                    THREE.RGBAFormat,
                    THREE.FloatType
                );
                texture.internalFormat = "RGBA32F";
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                this.textures.set(key, texture);
            } else {
                texture.image.data = textureData;
            }
            texture.needsUpdate = true;
        });

        this.disposers.set(key, disposer);
    }

    public dispose(colormapName: string, opacityMapName?: string, width?: number, height?: number): void {
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
