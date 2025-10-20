import Panel from "@/Panels/Panel";
import type PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { color } from "chart.js/helpers";
import { useState } from "react";
export function ColorEditorPanel() {
    const global_context = useScenario().global_context as WildfireGlobalContext
    const scalar_names = global_context.scalars.scalar_names;
    const [current_scalar_name, setCurrentScalarName] = useState(scalar_names[0] || "FUEL_CAT");

    const texture_manager = global_context.texture_manager;
    const colormap = texture_manager.getColormap(current_scalar_name) as PresetLinearColormap
    


    return (
        <Panel panel_name="Color Editor">
            <h2>Color Editor Panel</h2>
            
        </Panel>
    );
}

export default ColorEditorPanel;