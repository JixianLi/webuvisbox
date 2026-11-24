// ABOUTME: Full screen for the whole app through the browser's Fullscreen API: whether it is available, toggling it,
// ABOUTME: and a hook that follows it, including exits the app did not start (Esc, a swipe from the screen edge).

import { useSyncExternalStore } from "react";

// iPhone Safari has no Fullscreen API for anything but video; iPadOS 16.4+ and desktop browsers have it unprefixed.
export function isFullscreenSupported(): boolean {
    return typeof document !== "undefined" && document.fullscreenEnabled === true;
}

// Browsers allow entering full screen only during a user gesture (a click, a tap, a key press).
export function toggleFullscreen(): void {
    if (!isFullscreenSupported()) return;
    if (document.fullscreenElement) {
        void document.exitFullscreen();
    } else {
        void document.documentElement.requestFullscreen().catch(() => undefined);
    }
}

function subscribe(onChange: () => void) {
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
}

export function useIsFullscreen(): boolean {
    return useSyncExternalStore(subscribe, () => document.fullscreenElement !== null, () => false);
}
