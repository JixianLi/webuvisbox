// ABOUTME: The "texture rewritten in place" signal: TextureManager announces each rewrite of a texture it owns, and
// ABOUTME: renderers drawing on demand subscribe to redraw. Kept apart so renderers need not load the manager.

import type * as THREE from "three";

const TEXTURE_UPDATE_EVENT = "update";

type Dispatcher = THREE.EventDispatcher<Record<string, object>>;

export function announceTextureUpdate(texture: THREE.Texture) {
    (texture as unknown as Dispatcher).dispatchEvent({ type: TEXTURE_UPDATE_EVENT });
}

// Calls listener whenever texture is announced as rewritten; returns the unsubscribe function, for a React effect's
// cleanup. Textures nobody announces never fire it.
export function onTextureUpdate(texture: THREE.Texture, listener: () => void): () => void {
    const dispatcher = texture as unknown as Dispatcher;
    dispatcher.addEventListener(TEXTURE_UPDATE_EVENT, listener);
    return () => dispatcher.removeEventListener(TEXTURE_UPDATE_EVENT, listener);
}
