import { observer } from "mobx-react-lite";
import WildfireGlobalContext from "../../WildfireGlobalContext";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import InstancedConeMesh from "@/Renderers/Mesh/InstancedConeMesh";

export const WindGlyphMesh = observer(() => {
    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const windGlyphsConfig = globalData.windGlyphsConfig;

    if (!globalData || !windGlyphsConfig.display || windGlyphsConfig.instances.length === 0) {
        return null;
    }

    const baseScale = globalData.terrain.baseScale;

    const mesh = windGlyphsConfig.display ? <InstancedConeMesh
        instances={windGlyphsConfig.instances}
        radius={windGlyphsConfig.radius * baseScale}
        lengthScale={windGlyphsConfig.lengthScale * baseScale}
    /> : null;

    return mesh;
});

export default WindGlyphMesh;
