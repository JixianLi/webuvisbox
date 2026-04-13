import { observer } from "mobx-react-lite";
import { Panel } from "@/Panels/Panel";
import TerrainRenderer from "./TerrainRenderer";

const ContourBoxplotPanel = observer(() => {
    return <Panel panelName="Contour Boxplot" >
        <TerrainRenderer useOpacity={false} ctfName="boxplot"/>
    </Panel>
});

export default ContourBoxplotPanel;
