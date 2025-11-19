import { observer } from "mobx-react-lite";
import WildfireGlobalContext from "../../WildfireGlobalContext";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { ScalarFieldMesh } from "@/Renderers/Mesh/ScalarFieldMesh";
import { ContourMesh } from "./ContourMesh";
import { SquidGlyphMesh } from "./SquidGlyphMesh";
import { Html } from "@react-three/drei";


export const EnsembleTerrainScene = observer(() => {
    const global_data = useScenario().global_context as WildfireGlobalContext;

    // Terrain data
    const vertices = global_data.terrain.positions;
    const indices = global_data.terrain.indices;
    const scalars = global_data.scalars.rescaled;

    const ctf_name = 'boxplot';
    const otf_name = undefined;


    const texture = global_data.texture_manager.getTexture(ctf_name, otf_name);
    if (!texture) {
        return <Html><div>Loading colormap...</div></Html>;
    }

    const cIndex = global_data.scalars.scalar_names.indexOf(ctf_name);
    const oIndex = global_data.scalars.scalar_names.indexOf(otf_name);


    return <group>
        <ScalarFieldMesh vertices={vertices} indices={indices} scalars={scalars} texture={texture} cIndex={cIndex} oIndex={oIndex}
            shininess={0.0} specular="#000" depthWrite={true} />
        <ContourMesh />
        <SquidGlyphMesh />
    </group>
});

export default EnsembleTerrainScene;