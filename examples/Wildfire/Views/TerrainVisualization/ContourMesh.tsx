import { observer } from "mobx-react-lite";
import LinearTubeMesh from "@/Renderers/Mesh/LinearTubeMesh";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "../../WildfireGlobalContext";
// @ts-expect-error unused import
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";


export const ContourMesh = observer(() => {
    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const ensembleIndex = globalData.currentEnsembleIndex;
    const contourConfig = globalData.contourConfig;
    const baseScale = globalData.terrain.baseScale;

    if (!globalData || !globalData.contours) {
        return <Html><div>No contours available</div></Html>;
    }

    const primaryContour = [globalData.contours[ensembleIndex]];
    const primaryMesh = (contourConfig.displayPrimary) ? <LinearTubeMesh
        paths={primaryContour}
        radius={baseScale * contourConfig.primaryScale}
        radialSegments={contourConfig.radialSegments}
        color={globalData.ensembleColors["primary"]}
        shininess={0}
    /> : null;

    const secondaryContours = globalData.contours.filter((_, index) => index !== ensembleIndex);
    const secondaryMesh = (contourConfig.displaySecondary) ? <LinearTubeMesh
        paths={secondaryContours}
        radius={baseScale * contourConfig.secondaryScale}
        radialSegments={contourConfig.radialSegments}
        color={globalData.ensembleColors["secondary"]}
        shininess={0}
    /> : null;


    return (
        <group>
            {secondaryMesh}
            {primaryMesh}
        </group>
    );
});

export default ContourMesh;
