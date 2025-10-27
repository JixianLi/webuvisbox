import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import InstancedSphereMesh from "@/Renderers/Mesh/InstancedSphereMesh";

interface SeedsMeshProps {
    show_seeds?: boolean;
}

const SeedsMesh = observer((props: SeedsMeshProps) => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalContext;
    const seeds = global_context.seeds;
    const render_config = global_context.render_config;

    // Use props value if provided, otherwise use global context
    const shouldShow = props.show_seeds !== undefined
        ? props.show_seeds
        : global_context.trajectory_visualization.show_seeds;

    const seedsMesh = shouldShow ? (<InstancedSphereMesh
        points={seeds}
        radius={global_context.diag / render_config.seeds.radius_divisor}
        color={render_config.seeds.color} />) : null;

    return seedsMesh;
});

export default SeedsMesh;
