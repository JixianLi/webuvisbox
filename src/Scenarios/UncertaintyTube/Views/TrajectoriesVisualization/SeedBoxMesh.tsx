import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalContext";
import { BoxOutlineMesh } from "@/Renderers/Mesh/BoxOutlineMesh";


const SeedBoxMesh = observer(() => {
    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;

    if (!globalContext.seedbox.visible) {
        return null;
    }

    const position = globalContext.seedbox.position;
    const size = globalContext.seedbox.size;

    const color= globalContext.seedbox.active ? "red" : "gray";

    const bounds: [number, number, number, number, number, number] = [position[0], position[0] + size[0], position[1], position[1] + size[1], position[2], position[2] + size[2]];
    return (
        <BoxOutlineMesh
            boundingBox={bounds}
            color={color}
            linewidth={globalContext.diag/800}
            shininess={0}
            radialSegments={8}
        />
    );
})
export default SeedBoxMesh;
