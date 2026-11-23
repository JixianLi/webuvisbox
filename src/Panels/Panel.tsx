// ABOUTME: A panel: a title row (title, the panel's own header content, help, fit, collapse, close) over its content.
// ABOUTME: Its frame follows its placement: a bordered grid tile or content panel, the bare stage, or glass in the inspector.

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ChevronDown, ChevronUp, CircleHelp, FoldVertical, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScenario } from "../ScenarioManager/ScenarioManager";
import { commandRegistry, shortcutLabel } from "../Commands/CommandRegistry";
import { SHAPE, TYPE } from "../Theme/DesignTokens";
import { usePanelPlacement } from "./PanelPlacement";

interface PanelProps {
    panelName: string;
    children?: React.ReactNode;
    appbarContent?: React.ReactNode;
    helpContent?: React.ReactNode;
    sx?: object;
}

// The grid's row height in px (LayoutManager's rowHeight), for converting a measured height into rows.
export const GRID_ROW_HEIGHT = 50;

function withShortcut(label: string, commandId: string): string {
    const shortcut = commandRegistry.shortcutOf(commandId);
    return shortcut ? `${label} (${shortcutLabel(shortcut)})` : label;
}

export const Panel = observer((props: PanelProps) => {
    const scenario = useScenario();
    const theme = useTheme();
    const tokens = theme.tokens;
    const placement = usePanelPlacement();
    const panelName = props.panelName;
    const panelLayouts = scenario.panelLayouts;
    const layoutItem = panelLayouts.currentLayouts[panelLayouts.currentBreakpoint]?.find(panel => panel.i === panelName);
    const collapsed = Boolean(layoutItem?.collapsed);

    const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Fit: the content's natural height (its children's, with margins) plus the header and frame, in grid rows.
    const fitToContent = useCallback(() => {
        const content = contentRef.current;
        const header = headerRef.current;
        if (!content || !header || placement !== 'tile') {
            return;
        }
        const childrenHeight = Array.from(content.children).reduce((sum, child) => {
            const style = getComputedStyle(child);
            return sum + (child as HTMLElement).offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        }, 0);
        const contentStyle = getComputedStyle(content);
        const frame = 2 + header.offsetHeight + parseFloat(contentStyle.marginTop) + parseFloat(contentStyle.marginBottom);
        const gap = tokens.px(SHAPE.panelGap);
        const rows = Math.max(1, Math.ceil((frame + childrenHeight + gap) / (GRID_ROW_HEIGHT + gap)));
        panelLayouts.setPanelHeight(panelName, rows);
    }, [placement, panelLayouts, panelName, tokens]);

    useEffect(() => commandRegistry.setPanelAction(panelName, 'fit', fitToContent), [panelName, fitToContent]);

    const frames = {
        tile: { backgroundColor: tokens.surface, border: `1px solid ${tokens.border}`,
                borderRadius: `${tokens.px(SHAPE.panelRadius)}px` },
        content: { backgroundColor: tokens.surface, border: `1px solid ${tokens.border}`,
                   borderRadius: `${tokens.px(SHAPE.panelRadius)}px` },
        stage: { backgroundColor: tokens.canvas },
        floating: { backgroundColor: tokens.glass.fill,
                    backdropFilter: `blur(${tokens.glass.blur}px) saturate(${tokens.glass.saturate})`,
                    WebkitBackdropFilter: `blur(${tokens.glass.blur}px) saturate(${tokens.glass.saturate})`,
                    border: `1px solid ${tokens.glass.edge}`,
                    boxShadow: `inset 0 1px 0 ${tokens.glass.highlight}, ${tokens.shadowRaised}`,
                    borderRadius: `${tokens.px(12)}px` },
    };
    const headerAction = { color: tokens.textSecondary, p: 0.5, opacity: 0.5, transition: 'opacity 120ms',
                           '&:hover': { opacity: 1, backgroundColor: tokens.controlFill } };
    const icon = { size: tokens.px(15), strokeWidth: 1.75 };
    const showBody = !collapsed;

    return <Box key={"panel_" + panelName}
                onPointerEnter={() => commandRegistry.setActivePanel(panelName)}
                onFocusCapture={() => commandRegistry.setActivePanel(panelName)}
                sx={{ width: 1, height: placement === 'floating' ? 'auto' : 1, display: 'flex', flexDirection: 'column',
                      overflow: 'hidden', ...frames[placement],
                      '&:hover .panel-header-action': { opacity: 0.85 }, ...props.sx }}>
        <Box ref={headerRef} className="drag-handle"
             sx={{ height: tokens.px(SHAPE.panelHeaderHeight), flexShrink: 0, display: 'flex', alignItems: 'center',
                   gap: 0.25, pl: 1.5, pr: 0.75, color: tokens.text,
                   cursor: placement === 'tile' ? 'grab' : 'default',
                   borderBottom: showBody && placement !== 'stage' ? `1px solid ${tokens.border}` : 'none',
                   '&:active': { cursor: placement === 'tile' ? 'grabbing' : 'default' } }}>
            <Typography component="h2" noWrap
                        sx={{ flexGrow: 1, fontSize: tokens.px(TYPE.panelTitleSize), fontWeight: 600, letterSpacing: '0.005em' }}>
                {panelName}
            </Typography>
            {props.appbarContent}
            {props.helpContent && <>
                <IconButton size="small" aria-label="help" className="panel-header-action" sx={headerAction}
                            onClick={event => setHelpAnchor(event.currentTarget)}>
                    <CircleHelp {...icon} />
                </IconButton>
                <Menu anchorEl={helpAnchor} open={Boolean(helpAnchor)} onClose={() => setHelpAnchor(null)}>
                    {props.helpContent}
                </Menu>
            </>}
            {placement === 'tile' && (
                <Tooltip title={withShortcut('Fit to content', 'panel.fit')}>
                    <IconButton size="small" aria-label="fit to content" className="panel-header-action" sx={headerAction}
                                onClick={fitToContent}>
                        <FoldVertical {...icon} />
                    </IconButton>
                </Tooltip>
            )}
            {(placement === 'tile' || placement === 'floating') && (
                <Tooltip title={withShortcut(collapsed ? 'Expand' : 'Collapse', 'panel.collapse')}>
                    <IconButton size="small" aria-label={collapsed ? 'expand' : 'collapse'} className="panel-header-action"
                                sx={headerAction} onClick={() => commandRegistry.run('panel.collapse', panelName)}>
                        {collapsed ? <ChevronDown {...icon} /> : <ChevronUp {...icon} />}
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title={withShortcut('Close', 'panel.close')}>
                <IconButton size="small" aria-label="close panel" className="panel-header-action" sx={headerAction}
                            onClick={() => commandRegistry.run('panel.close', panelName)}>
                    <X {...icon} />
                </IconButton>
            </Tooltip>
        </Box>
        <Box ref={contentRef}
             sx={{ display: showBody ? 'flex' : 'none', flexDirection: 'column', flex: placement === 'floating' ? '0 1 auto' : 1,
                   minHeight: 0, m: placement === 'stage' ? 0 : 1.5, overflow: 'auto', justifyContent: 'flex-start',
                   alignItems: 'center' }}>
            {props.children}
        </Box>
    </Box>
});

export default Panel;
