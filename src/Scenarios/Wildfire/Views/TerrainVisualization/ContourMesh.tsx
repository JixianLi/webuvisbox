import { observer } from "mobx-react-lite";
import LinearTubeMesh from "@/Renderers/Mesh/LinearTubeMesh";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalData from "@/Scenarios/Wildfire/WildfireGlobalData";
// @ts-expect-error unused import
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";


export const ContourMesh = observer(() => {
    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalData;
    const ensemble_index = global_data.current_ensemble_index;
    const contour_configs = global_data.contour_configs;
    const base_scale = global_data.terrain.base_scale;  

    if (!global_data || !global_data.contours) {
        return <Html><div>No contours available</div></Html>;
    }

    const primary_contour = [global_data.contours[ensemble_index]];
    const primary_mesh = (contour_configs.display_primary) ? <LinearTubeMesh
        paths={primary_contour}
        radius={base_scale * contour_configs.primary_scale}
        radialSegments={contour_configs.radial_segments}
        color={global_data.ensemble_colors["primary"]}
        shininess={0}
    /> : null;

    const secondary_contours = global_data.contours.filter((_, index) => index !== ensemble_index);
    const secondary_mesh = (contour_configs.display_secondary) ? <LinearTubeMesh
        paths={secondary_contours}
        radius={base_scale * contour_configs.secondary_scale}
        radialSegments={contour_configs.radial_segments}
        color={global_data.ensemble_colors["secondary"]}
        shininess={0}
    /> : null;


    return (
        <group>
            {secondary_mesh}
            {primary_mesh}
        </group>
    );
});

export default ContourMesh;