import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import { BoxOutlineMesh } from "@/Renderers/Mesh/BoxOutlineMesh";


const SeedBoxMesh = observer(() => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalContext;

    if (!global_context.seedbox.visible) {
        return null;
    }

    const position = global_context.seedbox.position;
    const size = global_context.seedbox.size;

    const color= global_context.seedbox.active ? "red" : "gray";

    const bounds: [number, number, number, number, number, number] = [position[0], position[0] + size[0], position[1], position[1] + size[1], position[2], position[2] + size[2]];
    return (
        <BoxOutlineMesh
            boundingBox={bounds}
            color={color}
            linewidth={global_context.diag/800}
            shininess={0}
            radialSegments={8}
        />
    );
})
export default SeedBoxMesh;