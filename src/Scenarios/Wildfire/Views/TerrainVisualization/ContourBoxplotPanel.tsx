import { observer } from "mobx-react-lite";
import { Panel } from "@/Panels/Panel";
import TerrainRenderer from "./TerrainRenderer";

const ContourBoxplotPanel = observer(() => {
    return <Panel panelName="Contour Boxplot" >
        <TerrainRenderer use_opacity={false} ctf_name="boxplot"/>
    </Panel>
});

export default ContourBoxplotPanel;