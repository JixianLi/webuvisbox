// ABOUTME: Wires the Trace library renderer to the chatUI global context.
// ABOUTME: Reads actors / trace / selection from the store and forwards onSelect.

import { useState } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import Panel from "../../../Panels/Panel";
import { Trace } from "../../../Renderers/Trace";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type ChatUIGlobalContext from "../ChatUIGlobalContext";

const TracePanel = observer(() => {
    const context = useScenario().globalContext as ChatUIGlobalContext;
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);

    const appbarContent = (
        <>
            <IconButton
                size="small"
                edge="start"
                color="inherit"
                aria-label="settings"
                sx={{ mr: 1 }}
                onClick={(event) => setAnchor(event.currentTarget)}
            >
                <MenuIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <Box sx={{ px: 2, py: 1, width: 200 }} onKeyDown={(event) => event.stopPropagation()}>
                    <Typography variant="caption" color="text.secondary">
                        Font size: {context.traceFontSize}px
                    </Typography>
                    <Slider
                        size="small"
                        min={10}
                        max={24}
                        step={1}
                        value={context.traceFontSize}
                        onChange={(_, value) => context.setTraceFontSize(value as number)}
                    />
                </Box>
            </Menu>
        </>
    );

    return (
        <Panel panelName="Trace" appbarContent={appbarContent}>
            <Trace
                actors={context.actors.slice()}
                messages={context.traceMessages.slice()}
                selectedId={context.selectedTraceId}
                onSelect={(id) => context.selectTrace(id)}
                fontSize={context.traceFontSize}
            />
        </Panel>
    );
});

export default TracePanel;
