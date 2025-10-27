import Panel from "@/Panels/Panel";
import { SharedCameraRenderer } from "./TrajectoriesVisualization/SharedCameraRenderer";


const PredictedTrajectoriesPanel = () => {
    return (
        <Panel panel_name="Predicted Trajectories" >
            <SharedCameraRenderer show_uncertainty_path={false} show_uncertainty_tube={false} show_primary_path={true} />
        </Panel>
    );
};
export default PredictedTrajectoriesPanel;