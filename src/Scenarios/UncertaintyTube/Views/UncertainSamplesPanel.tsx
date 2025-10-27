import Panel from "@/Panels/Panel";
import { SharedCameraRenderer } from "./TrajectoriesVisualization/SharedCameraRenderer";


const UncertaintySamplesPanel = () => {
    return (
        <Panel panel_name="Uncertainty Samples (Spaghetti Plot)" >
            <SharedCameraRenderer show_uncertainty_path={true} show_uncertainty_tube={false} show_primary_path={false} />
        </Panel>
    );
};
export default UncertaintySamplesPanel;