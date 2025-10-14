import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import { LinearTubeMesh } from "@/Renderers/Mesh/LinearTubeMesh";

const UncertaintyPathMesh = observer(() => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalContext;
    const primary_paths = global_context.primary_trajectories;
    const diag = global_context.diag;

    const primary_tubes = global_context.trajectory_visualization.show_path ? (
        <LinearTubeMesh
            paths={primary_paths}
            radius={diag / global_context.render_config.paths.primary.radius_divisor}
            color={global_context.render_config.paths.primary.color}
            radialSegments={global_context.render_config.paths.primary.radial_segments}
        />
    ) : null;

    const secondary_paths = global_context.secondary_trajectories;

    const secondary_tubes = global_context.trajectory_visualization.show_uncertainty_path ? (
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
