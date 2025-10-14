import { observer } from "mobx-react-lite";
import WildfireGlobalContext from "../../WildfireGlobalData";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import InstancedConeMesh from "@/Renderers/Mesh/InstancedConeMesh";

export const WindGlyphMesh = observer(() => {
    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const wind_glyphs_config = global_data.wind_glyphs_config;

    if (!global_data || !wind_glyphs_config.display || wind_glyphs_config.instances.length === 0) {
        return null;
    }

    const base_scale = global_data.terrain.base_scale;

    const mesh = wind_glyphs_config.display ? <InstancedConeMesh
        instances={wind_glyphs_config.instances}
        radius={wind_glyphs_config.radius * base_scale}
        length_scale={wind_glyphs_config.length_scale * base_scale}
    /> : null;

    return mesh;
});

export default WindGlyphMesh;