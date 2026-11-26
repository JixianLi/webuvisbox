// ABOUTME: A double press (click, tap or pen) on the canvas resets the default controls to their saved view, the same
// ABOUTME: gesture on desktop and on touch screens.

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { createDoublePressDetector } from "../../Helpers/DoublePress";

// Inside a <Canvas> whose controls are the default (makeDefault).
export function DoublePressToReset() {
    const element = useThree(state => state.gl.domElement);
    const invalidate = useThree(state => state.invalidate);
    const controls = useThree(state => state.controls) as (THREE.EventDispatcher & { reset?: () => void }) | null;

    useEffect(() => {
        if (!controls?.reset) {
            return;
        }
        const detect = createDoublePressDetector(() => {
            controls.reset?.();
            invalidate();
        });
        const onPointerDown = (event: PointerEvent) => detect(event.timeStamp);
        element.addEventListener("pointerdown", onPointerDown);
        return () => element.removeEventListener("pointerdown", onPointerDown);
    }, [element, controls, invalidate]);
    return null;
}

export default DoublePressToReset;
