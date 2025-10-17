import ContourBanddepthPanel  from "./Views/ContourBanddepthPanel/ContourBanddepthPanel";
import ContourConfigPanel from "./Views/ContourConfigPanel/ContourConfigPanel";
import TerrainVisualizationPanel from "./Views/TerrainVisualization/TerrainVisualizationPanel";
import ContourBoxplotPanel from "./Views/TerrainVisualization/ContourBoxplotPanel";
import TimeNavigationPanel from "./Views/TimeNavigationPanel/TimeNavigationPanel";
import WindGlyphConfigPanel from "./Views/WindGlyphConfigPanel/WindGlyphConfigPanel";
import ColorEditorPanel from "./Views/ColorEditorPanel/ColorEditorPanel";
import OpacityEditorPanel from "./Views/OpacityEditorPanel/OpacityEditorPanel";

export function wildFirePanelMappingFunction(viewname:string): React.ReactNode {
    switch(viewname){
        case "Terrain Visualization":
            return <TerrainVisualizationPanel />;
            case "Contour Boxplot":
            return <ContourBoxplotPanel />;
        case "Contour Banddepths":
            return <ContourBanddepthPanel />;
        case "Contour Configuration":
            return <ContourConfigPanel />;
        case "Time Navigation":
            return <TimeNavigationPanel />;
        case "Wind Glyph Configuration":
            return <WindGlyphConfigPanel />;
        case "Color Editor":
            return <ColorEditorPanel />;
        case "Opacity Editor":
            return <OpacityEditorPanel />;
        default:
            throw new Error(`Unknown view name: ${viewname}`);
            return <div>Unknown view: {viewname}</div>;
    }
}