import { observer } from "mobx-react-lite";
import WildfireGlobalData from "../../WildfireGlobalData";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { ScalarFieldMesh } from "@/Renderers/Mesh/ScalarFieldMesh";
import { ContourMesh } from "./ContourMesh";
import { WindGlyphMesh } from "./WindGlyphMesh";
import { Html } from "@react-three/drei";

interface TerrainSceneProps {
    use_opacity?: boolean;
    ctf_name?: string;
    otf_name?: string;
}

export const TerrainScene = observer((props: TerrainSceneProps) => {
    const global_data = useScenario().global_context as WildfireGlobalData;
    const terrain_view_config = global_data.terrain_view_config;

    // Terrain data
    const vertices = global_data.terrain.positions;
    const indices = global_data.terrain.indices;
    const scalars = global_data.scalars.rescaled;

    const use_opacity = props.use_opacity === undefined ? true : props.use_opacity;
    const ctf_name = props.ctf_name || terrain_view_config.current_ctf_name;
    const otf_name = use_opacity ? props.otf_name || terrain_view_config.current_otf_name : undefined;


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
        <WindGlyphMesh />
    </group>
});

export default TerrainScene;