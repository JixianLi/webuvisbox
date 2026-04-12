// ABOUTME: Manages the responsive grid layout of scenario panels.
// ABOUTME: Renders the header bar, panel grid, and loading indicator.

import React from "react";
import { observer } from "mobx-react-lite";
import { Responsive, WidthProvider } from "react-grid-layout";

import type { AppLayout, AppLayouts, PanelLayouts } from "@/Types/PanelLayouts";
import { useTheme } from "@mui/material/styles";
import HeaderBar from "./HeaderBar/HeaderBar";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { scenarioRegistry } from "@/Scenarios";
import { usePromiseTracker } from "react-promise-tracker";
import PacmanLoader from "react-spinners/PacmanLoader";
// @ts-ignore
import { toJS } from "mobx";

// Use WidthProvider to get the correct container width for responsiveness
const ResponsiveGridLayout = WidthProvider(Responsive);

const LoadingIndicator = observer(function LoadingIndicator() {
    const theme = useTheme();
    const { promiseInProgress } = usePromiseTracker()

    return promiseInProgress ? (
        <div className={'fullscreen_cover'}>
            <PacmanLoader
                color={theme.palette.primary.main}
                size={150}
            />
        </div>
    ) : null
});

const LayoutManager: React.FC = observer(() => {
    const scenario = useScenario();
    const panel_layouts: PanelLayouts = scenario.panel_layouts!;
    const theme = useTheme();

    if (!scenario.fully_loaded) {
        return <div style={{ width: '100vw', height: '100vh', backgroundColor: theme.palette.background.default }}>
            <HeaderBar />
        </div>;
    }
    const current_layouts = panel_layouts.current_layouts;

    const onLayoutChange = (_: AppLayout[], all_layouts: AppLayouts) => {
        panel_layouts.setCurrentLayout(all_layouts);
    };

    const onBreakpointChange = (newBreakpoint: string) => {
        panel_layouts.setCurrentBreakpoint(newBreakpoint);
    };

    const layoutPanels = () => {
        const panelMapping = scenarioRegistry.get(scenario.name).panelMapping;
        const breakpoint = panel_layouts.current_breakpoint;
        const layout = panel_layouts.current_layouts[breakpoint];
        return layout.map((panel) => {
            return panel.visible ? (
                <div key={panel.i}>
                    {panelMapping(panel.i)}
                </div>
            ) : <div key={panel.i} />;
        });
    };

    return <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <HeaderBar />
        <ResponsiveGridLayout
            className="layout"
            layouts={current_layouts}
            breakpoints={panel_layouts.breakpoints}
            cols={panel_layouts.cols}
            rowHeight={50}
            onBreakpointChange={onBreakpointChange}
            onLayoutChange={onLayoutChange}
            draggableHandle={".drag-handle"}
        >
            {layoutPanels()}
        </ResponsiveGridLayout>
        <LoadingIndicator />
    </div>
});


export default LayoutManager;
