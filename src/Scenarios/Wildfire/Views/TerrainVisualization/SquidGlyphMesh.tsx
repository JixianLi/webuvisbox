import { observer } from "mobx-react-lite";
import WildfireGlobalContext from "../../WildfireGlobalContext";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import SingleColorBufferedMesh from "@/Renderers/Mesh/SingleColorBufferedMesh";

export const SquidGlyphMesh = observer(() => {
    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const squid_glyphs = global_data.squid_glyphs;

    if (!global_data || !squid_glyphs.display) {
        return null;
    }
    
    const mesh = squid_glyphs.display ? <SingleColorBufferedMesh
        vertices={squid_glyphs.vertices}
        indices={squid_glyphs.faces}
        color={squid_glyphs.color.toString()}
        shininess={0}
        specular="black"
    /> : null

    return mesh;
});

export default SquidGlyphMesh;