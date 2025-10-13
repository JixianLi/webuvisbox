import { observer } from "mobx-react-lite";
import { Panel } from "@/Panels/Panel";
import TerrainRenderer from "./TerrainRenderer";

const TerrainVisualizationPanel = observer(() => {
    return <Panel panel_name="Terrain Visualization" >
        <TerrainRenderer />
    </Panel>
});

export default TerrainVisualizationPanel;