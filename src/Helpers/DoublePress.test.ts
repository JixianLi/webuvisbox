import { describe, expect, it, vi } from 'vitest';
import { createDoublePressDetector } from './DoublePress';

describe('createDoublePressDetector', () => {
    it('fires on the second of two presses closer than the interval', () => {
        const onDoublePress = vi.fn();
        const press = createDoublePressDetector(onDoublePress, 300);
        press(1000);
        press(1200);
        expect(onDoublePress).toHaveBeenCalledOnce();
    });

    it('does not fire for presses further apart than the interval', () => {
        const onDoublePress = vi.fn();
        const press = createDoublePressDetector(onDoublePress, 300);
        press(1000);
        press(1400);
        expect(onDoublePress).not.toHaveBeenCalled();
    });

    it('starts a new pair after firing, so three quick presses fire once', () => {
        const onDoublePress = vi.fn();
        const press = createDoublePressDetector(onDoublePress, 300);
        press(1000);
        press(1100);
        press(1200);
        expect(onDoublePress).toHaveBeenCalledOnce();
    });
});
