import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalData from "../../UncertaintyTubeGlobalData";
import InstancedSphereMesh from "@/Renderers/Mesh/InstancedSphereMesh";

const SeedsMesh = observer(() => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalData;
    const seeds = global_context.seeds;
    const render_config = global_context.render_config;


    const seedsMesh = global_context.trajectory_visualization.show_seeds ? (<InstancedSphereMesh
        points={seeds}
        radius={global_context.diag / render_config.seeds.radius_divisor}
        color={render_config.seeds.color} />) : null;

    return seedsMesh;
});

export default SeedsMesh;
