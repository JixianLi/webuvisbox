import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalContext";
import TexturedBufferedMesh from "@/Renderers/Mesh/TexturedBufferedMesh";

interface UncertaintyTubeMeshProps {
    showUncertaintyTube?: boolean;
}

const UncertaintyTubeMesh = observer((props: UncertaintyTubeMeshProps) => {
    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;
    const textureHeight = globalContext.colormapConfig.textureHeight;
    const textureWidth = globalContext.colormapConfig.textureWidth;
    const texture = globalContext.textureManager.getTexture("uncertainty_tube_colormap", undefined, textureWidth, textureHeight);
    const loaded = globalContext.uncertaintyTubes.loaded;

    // Use props value if provided, otherwise use global context
    const shouldShow = props.showUncertaintyTube !== undefined
        ? props.showUncertaintyTube
        : globalContext.trajectoryVisualization.showUncertaintyTube;

    if (!(loaded && shouldShow)) {
        return null;
    }

    const vertices = globalContext.uncertaintyTubes.vertices;
    const indices = globalContext.uncertaintyTubes.faces;
    const uv = globalContext.uncertaintyTubes.uv;

    console.log(toJS(globalContext.uncertaintyTubes))

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
