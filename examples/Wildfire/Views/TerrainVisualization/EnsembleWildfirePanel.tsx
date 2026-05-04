import { observer } from "mobx-react-lite";
import { Panel } from "@/Panels/Panel";
import EnsembleTerrainRenderer from "./EnsembleTerrainRenderer";

const EnsembleWildfirePanel = observer(() => {
    return <Panel panelName="Ensemble Wildfire" >
        <EnsembleTerrainRenderer />
    </Panel>
});

export default EnsembleWildfirePanel;
