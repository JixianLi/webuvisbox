import Panel from "@/Panels/Panel"
import ContourBanddepthPlot from "./ContourBanddepthPlot";

export const ContourBanddepthPanel = () => {
    return (
        <Panel panelName="Contour Banddepths">
            <ContourBanddepthPlot />
        </Panel>
    );
};

export default ContourBanddepthPanel;