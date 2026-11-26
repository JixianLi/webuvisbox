// ABOUTME: Places the camera for the canvas's aspect ratio: at the given position on a wide canvas, backed off along the
// ABOUTME: same direction on a narrow one (phones in portrait) so the scene's width still fits.

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface FitCameraToAspectProps {
    // Where the camera sits when the canvas is at least minimumAspect wide (relative to the scene's origin).
    position: THREE.Vector3Tuple;
    // Below this width / height the horizontal field of view no longer holds the scene; the camera then moves back by
    // minimumAspect / aspect (the horizontal field of view shrinks roughly in proportion to the aspect).
    minimumAspect?: number;
}

// Inside a <Canvas>. When the default controls (makeDefault) can save their state, the fitted view is saved, so their
// reset() (and DoublePressToReset) returns to it.
export function FitCameraToAspect({ position, minimumAspect = 1 }: FitCameraToAspectProps) {
    const camera = useThree(state => state.camera);
    const invalidate = useThree(state => state.invalidate);
    const controls = useThree(state => state.controls) as (THREE.EventDispatcher & { saveState?: () => void }) | null;
    const aspect = useThree(state => state.size.width / Math.max(1, state.size.height));
    const [x, y, z] = position;

    useEffect(() => {
        camera.position.set(x, y, z).multiplyScalar(Math.max(1, minimumAspect / aspect));
        controls?.saveState?.();
        invalidate();
    }, [camera, controls, x, y, z, minimumAspect, aspect, invalidate]);
    return null;
}

export default FitCameraToAspect;
