import Panel from "@/Panels/Panel";
import { SharedCameraRenderer } from "./TrajectoriesVisualization/SharedCameraRenderer";


const PredictedTrajectoriesPanel = () => {
    return (
        <Panel panelName="Predicted Trajectories" >
            <SharedCameraRenderer showUncertaintyPath={false} showUncertaintyTube={false} showPrimaryPath={true} />
        </Panel>
    );
};
export default PredictedTrajectoriesPanel;
