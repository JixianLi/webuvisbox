import { observer } from "mobx-react-lite";
import WildfireGlobalContext from "../../WildfireGlobalContext";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import SingleColorBufferedMesh from "@/Renderers/Mesh/SingleColorBufferedMesh";

export const SquidGlyphMesh = observer(() => {
    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const squidGlyphs = globalData.squidGlyphs;

    if (!globalData || !squidGlyphs.display) {
        return null;
    }

    const mesh = squidGlyphs.display ? <SingleColorBufferedMesh
        vertices={squidGlyphs.vertices}
        indices={squidGlyphs.faces}
        color={squidGlyphs.color.toString()}
        shininess={0}
        specular="black"
    /> : null

    return mesh;
});

export default SquidGlyphMesh;
