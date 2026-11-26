// ABOUTME: Every member's position at the current time, as instanced spheres (one draw call for all members).

import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { InstancedSphereMesh } from "../../../Renderers/Mesh/InstancedSphereMesh";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { LorenzEnsembleGlobalContext } from "../LorenzEnsembleGlobalContext";

export const MemberPositions = observer(function MemberPositions({ color, radius }: { color: string; radius: number }) {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
    const { paths } = context.ensemble;
    const sample = context.visibleSampleCount - 1;
    const points = useMemo(() => paths.map(path => [path[sample * 3], path[sample * 3 + 1], path[sample * 3 + 2]] as
                                                   [number, number, number]), [paths, sample]);
    return <InstancedSphereMesh points={points} radius={radius} color={color} widthSegments={12} heightSegments={12} />;
});

export default MemberPositions;
