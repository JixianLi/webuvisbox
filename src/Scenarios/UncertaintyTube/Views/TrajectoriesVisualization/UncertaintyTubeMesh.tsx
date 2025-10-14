import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import TexturedBufferedMesh from "@/Renderers/Mesh/TexturedBufferedMesh";

const UncertaintyTubeMesh = observer(() => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalContext;
    const texture_height = global_context.colormap_config.texture_height;
    const texuter_width = global_context.colormap_config.texture_width;
    const texture = global_context.texture_manager.getTexture("uncertainty_tube_colormap", undefined, texuter_width, texture_height);
    const loaded = global_context.uncertainty_tubes.loaded;
    if (!(loaded && global_context.trajectory_visualization.show_uncertainty_tube)) {
        return null;
    }

    const vertices = global_context.uncertainty_tubes.vertices;
    const indices = global_context.uncertainty_tubes.faces;
    const uv = global_context.uncertainty_tubes.uv;

    console.log(toJS(global_context.uncertainty_tubes))

    return (
        <TexturedBufferedMesh
            vertices={vertices}
            indices={indices}
            uv={uv}
            colormap={texture}
        />
    );
});

export default UncertaintyTubeMesh;