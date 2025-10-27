import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import { LinearTubeMesh } from "@/Renderers/Mesh/LinearTubeMesh";

interface UncertaintyPathMeshProps {
    show_primary_path?: boolean;
    show_uncertainty_path?: boolean;
}

const UncertaintyPathMesh = observer((props: UncertaintyPathMeshProps) => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalContext;
    const primary_paths = global_context.primary_trajectories;
    const diag = global_context.diag;

    // Use props value if provided, otherwise use global context
    const shouldShowPrimary = props.show_primary_path !== undefined
        ? props.show_primary_path
        : global_context.trajectory_visualization.show_path;

    const primary_tubes = shouldShowPrimary ? (
        <LinearTubeMesh
            paths={primary_paths}
            radius={diag / global_context.render_config.paths.primary.radius_divisor}
            color={global_context.render_config.paths.primary.color}
            radialSegments={global_context.render_config.paths.primary.radial_segments}
        />
    ) : null;

    const secondary_paths = global_context.secondary_trajectories;

    // Use props value if provided, otherwise use global context
    const shouldShowUncertainty = props.show_uncertainty_path !== undefined
        ? props.show_uncertainty_path
        : global_context.trajectory_visualization.show_uncertainty_path;

    const secondary_tubes = shouldShowUncertainty ? (
        <LinearTubeMesh
            paths={secondary_paths}
            radius={diag / global_context.render_config.paths.secondary.radius_divisor}
            color={global_context.render_config.paths.secondary.color}
            radialSegments={global_context.render_config.paths.secondary.radial_segments}
        />
    ) : null;

    // Your mesh implementation here
    return <>
        {primary_tubes}
        {secondary_tubes}
    </>;
});

export default UncertaintyPathMesh;
