import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalContext";
import { LinearTubeMesh } from "@/Renderers/Mesh/LinearTubeMesh";

interface UncertaintyPathMeshProps {
    showPrimaryPath?: boolean;
    showUncertaintyPath?: boolean;
}

const UncertaintyPathMesh = observer((props: UncertaintyPathMeshProps) => {
    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;
    const primaryPaths = globalContext.primaryTrajectories;
    const diag = globalContext.diag;

    // Use props value if provided, otherwise use global context
    const shouldShowPrimary = props.showPrimaryPath !== undefined
        ? props.showPrimaryPath
        : globalContext.trajectoryVisualization.showPath;

    const primaryTubes = shouldShowPrimary ? (
        <LinearTubeMesh
            paths={primaryPaths}
            radius={diag / globalContext.renderConfig.paths.primary.radiusDivisor}
            color={globalContext.renderConfig.paths.primary.color}
            radialSegments={globalContext.renderConfig.paths.primary.radialSegments}
        />
    ) : null;

    const secondaryPaths = globalContext.secondaryTrajectories;

    // Use props value if provided, otherwise use global context
    const shouldShowUncertainty = props.showUncertaintyPath !== undefined
        ? props.showUncertaintyPath
        : globalContext.trajectoryVisualization.showUncertaintyPath;

    const secondaryTubes = shouldShowUncertainty ? (
        <LinearTubeMesh
            paths={secondaryPaths}
            radius={diag / globalContext.renderConfig.paths.secondary.radiusDivisor}
            color={globalContext.renderConfig.paths.secondary.color}
            radialSegments={globalContext.renderConfig.paths.secondary.radialSegments}
        />
    ) : null;

    // Your mesh implementation here
    return <>
        {primaryTubes}
        {secondaryTubes}
    </>;
});

export default UncertaintyPathMesh;
