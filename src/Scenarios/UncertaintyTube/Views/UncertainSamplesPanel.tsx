import Panel from "@/Panels/Panel";
import { SharedCameraRenderer } from "./TrajectoriesVisualization/SharedCameraRenderer";


const UncertaintySamplesPanel = () => {
    return (
        <Panel panelName="Uncertainty Samples (Spaghetti Plot)" >
            <SharedCameraRenderer showUncertaintyPath={true} showUncertaintyTube={false} showPrimaryPath={false} />
        </Panel>
    );
};
export default UncertaintySamplesPanel;
