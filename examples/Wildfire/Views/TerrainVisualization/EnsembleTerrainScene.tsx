import { observer } from "mobx-react-lite";
import WildfireGlobalContext from "../../WildfireGlobalContext";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { ScalarFieldMesh } from "@/Renderers/Mesh/ScalarFieldMesh";
import { ContourMesh } from "./ContourMesh";
import { SquidGlyphMesh } from "./SquidGlyphMesh";
import { Html } from "@react-three/drei";


export const EnsembleTerrainScene = observer(() => {
    const globalData = useScenario().globalContext as WildfireGlobalContext;

    // Terrain data
    const vertices = globalData.terrain.positions;
    const indices = globalData.terrain.indices;
    const scalars = globalData.scalars.rescaled;

    const ctfName = 'boxplot';
    const otfName = undefined;


    const texture = globalData.textureManager.getTexture(ctfName, otfName);
    if (!texture) {
        return <Html><div>Loading colormap...</div></Html>;
    }

    const cIndex = globalData.scalars.scalarNames.indexOf(ctfName);
    const oIndex = globalData.scalars.scalarNames.indexOf(otfName);


    return <group>
        <ScalarFieldMesh vertices={vertices} indices={indices} scalars={scalars} texture={texture} cIndex={cIndex} oIndex={oIndex}
            shininess={0.0} specular="#000" depthWrite={true} />
        <ContourMesh />
        <SquidGlyphMesh />
    </group>
});

export default EnsembleTerrainScene;
