import Panel from "@/Panels/Panel";
import { SharedCameraRenderer } from "./TrajectoriesVisualization/SharedCameraRenderer";


const UncertaintyTubesPanel = () => {
    return (
        <Panel panelName="Uncertainty Tubes" >
            <SharedCameraRenderer showUncertaintyPath={false} showUncertaintyTube={true} showPrimaryPath={false} />
        </Panel>
    );
};
export default UncertaintyTubesPanel;
