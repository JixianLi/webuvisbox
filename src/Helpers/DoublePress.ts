// ABOUTME: Detects a double press from pointer-down times, the same for mouse, touch and pen (a touch screen has no
// ABOUTME: double-click event to rely on).

export const DOUBLE_PRESS_INTERVAL_MS = 300;

// Returns the function to call on each pointer down, with its time in ms; onDoublePress runs on the second of two
// presses closer than intervalMs. A third press starts a new pair.
export function createDoublePressDetector(onDoublePress: () => void,
                                          intervalMs: number = DOUBLE_PRESS_INTERVAL_MS): (time: number) => void {
    let lastPress: number | null = null;
    return (time: number) => {
        if (lastPress !== null && time - lastPress > 0 && time - lastPress < intervalMs) {
            lastPress = null;
            onDoublePress();
            return;
        }
        lastPress = time;
    };
}
