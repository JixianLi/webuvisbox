import { observer } from "mobx-react-lite";
import { Panel } from "@/Panels/Panel";
import EnsembleTerrainRenderer from "./EnsembleTerrainRenderer";

const EnsembleTerrainPanel = observer(() => {
    return <Panel panel_name="Ensemble Wildfire" >
        <EnsembleTerrainRenderer />
    </Panel>
});

export default EnsembleTerrainPanel;