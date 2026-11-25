// ABOUTME: The volume rendering example's transfer-function editor: the shown dataset's colormap and opacity map over
// ABOUTME: its histogram.

import { observer } from "mobx-react-lite";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { TransferFunctionEditor } from "../../../Renderers/TransferFunction/TransferFunctionEditor";
import type { VolumeRenderingGlobalContext } from "../VolumeRenderingGlobalContext";
import { transferFunctionFor } from "../VolumeTransferFunctions";

export default observer(function TransferFunctionPanel() {
    const context = useScenario().globalContext as VolumeRenderingGlobalContext;
    const { colormap, opacityMap } = transferFunctionFor(context, context.dataset);
    return (
        <Panel panelName="Transfer function">
            <TransferFunctionEditor key={context.dataset} colormap={colormap} opacityMap={opacityMap}
                                    valueRange={[0, 1]} histogram={context.histogram} />
        </Panel>
    );
});
