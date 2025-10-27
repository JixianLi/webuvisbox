import Panel from "@/Panels/Panel";
import { SharedCameraRenderer } from "./TrajectoriesVisualization/SharedCameraRenderer";


const UncertaintyTubesPanel = () => {
    return (
        <Panel panel_name="Uncertainty Tubes" >
            <SharedCameraRenderer show_uncertainty_path={false} show_uncertainty_tube={true} show_primary_path={false} />
        </Panel>
    );
};
export default UncertaintyTubesPanel;