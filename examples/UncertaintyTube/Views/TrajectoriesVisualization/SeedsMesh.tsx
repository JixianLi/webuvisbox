import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalContext";
import InstancedSphereMesh from "@/Renderers/Mesh/InstancedSphereMesh";

interface SeedsMeshProps {
    showSeeds?: boolean;
}

const SeedsMesh = observer((props: SeedsMeshProps) => {
    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;
    const seeds = globalContext.seeds;
    const renderConfig = globalContext.renderConfig;

    // Use props value if provided, otherwise use global context
    const shouldShow = props.showSeeds !== undefined
        ? props.showSeeds
        : globalContext.trajectoryVisualization.showSeeds;

    const seedsMesh = shouldShow ? (<InstancedSphereMesh
        points={seeds}
        radius={globalContext.diag / renderConfig.seeds.radiusDivisor}
        color={renderConfig.seeds.color} />) : null;

    return seedsMesh;
});

export default SeedsMesh;
