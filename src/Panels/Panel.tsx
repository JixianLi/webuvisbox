// ABOUTME: A panel: a title row (title, the panel's own header content, help, fit, collapse, close) over its content.
// ABOUTME: Its frame follows its type (layout item `type`): a bordered tile, unframed on the canvas, or glass (overlay).

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { ChevronDown, ChevronUp, CircleHelp, FoldVertical, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScenario } from "../ScenarioManager/ScenarioManager";
import { commandRegistry, shortcutLabel } from "../Commands/CommandRegistry";
import { SHAPE, TYPE } from "../Theme/DesignTokens";
import type { PanelType } from "../Types/PanelLayouts";

interface PanelProps {
    panelName: string;
    // A scene: a rendering whose colors are judged (a 3D view, a rendered field or image), not controls or a chart. In
    // a mode that sets controlPanels tokens (neutral) scenes keep the mode's surface and the other panels take those.
    scene?: boolean;
    children?: React.ReactNode;
    appbarContent?: React.ReactNode;
    helpContent?: React.ReactNode;
    sx?: object;
}

function withShortcut(label: string, commandId: string): string {
    const shortcut = commandRegistry.shortcutOf(commandId);
    return shortcut ? `${label} (${shortcutLabel(shortcut)})` : label;
}

// The provider is always rendered, whatever the mode: a wrapper present in one mode only would change the element
// tree, and React would remount the panel's content (losing its state) on every switch into or out of that mode.
export function Panel(props: PanelProps) {
    const theme = useTheme();
    const panelTheme = props.scene ? theme : theme.controlPanelTheme ?? theme;
    return <ThemeProvider theme={panelTheme}><PanelFrame {...props} /></ThemeProvider>;
}

const PanelFrame = observer((props: PanelProps) => {
    const scenario = useScenario();
    const theme = useTheme();
    const tokens = theme.tokens;
    const panelName = props.panelName;
    const panelLayouts = scenario.panelLayouts;
    const layoutItem = panelLayouts.currentLayouts[panelLayouts.currentBreakpoint]?.find(panel => panel.i === panelName);
    const type: PanelType = layoutItem?.type ?? 'regular';
    const collapsed = Boolean(layoutItem?.collapsed);

    const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Fit: the content's natural height (its children's, with margins) plus the header and frame, in grid rows.
    const fitToContent = useCallback(() => {
        const content = contentRef.current;
        const header = headerRef.current;
        if (!content || !header || type !== 'regular') {
            return;
        }
        const childrenHeight = Array.from(content.children).reduce((sum, child) => {
            const style = getComputedStyle(child);
            return sum + (child as HTMLElement).offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        }, 0);
        const contentStyle = getComputedStyle(content);
        const frame = 2 + header.offsetHeight + parseFloat(contentStyle.marginTop) + parseFloat(contentStyle.marginBottom);
        const gap = tokens.px(SHAPE.panelGap);
        const rows = Math.max(1, Math.ceil((frame + childrenHeight + gap) / (panelLayouts.rowHeight + gap)));
        panelLayouts.setPanelHeight(panelName, rows);
    }, [type, panelLayouts, panelName, tokens]);

    useEffect(() => commandRegistry.setPanelAction(panelName, 'fit', fitToContent), [panelName, fitToContent]);

    const frames = {
        regular: { backgroundColor: tokens.surface, border: `1px solid ${tokens.border}`,
                   borderRadius: `${tokens.px(SHAPE.panelRadius)}px` },
        borderless: { backgroundColor: tokens.borderlessFill },
        overlay: { backgroundColor: tokens.glass.fill,
                   backdropFilter: `blur(${tokens.glass.blur}px) saturate(${tokens.glass.saturate})`,
                   WebkitBackdropFilter: `blur(${tokens.glass.blur}px) saturate(${tokens.glass.saturate})`,
                   border: `1px solid ${tokens.glass.edge}`,
                   boxShadow: `inset 0 1px 0 ${tokens.glass.highlight}, ${tokens.shadowRaised}`,
                   borderRadius: `${tokens.px(12)}px` },
    };
    const chrome = tokens.chrome;
    const headerAction = { color: chrome?.text ?? tokens.textSecondary, p: 0.5, opacity: 0.5, transition: 'opacity 120ms',
                           '&:hover': { opacity: 1, backgroundColor: chrome ? 'rgba(255, 255, 255, 0.14)' : tokens.controlFill } };
    const icon = { size: tokens.px(15), strokeWidth: 1.75 };
    const showBody = !collapsed;

    return <Box key={"panel_" + panelName}
                onPointerEnter={() => commandRegistry.setActivePanel(panelName)}
                // Panel commands act on the panel under the pointer; keyboard focus inside keeps the panel active.
                onPointerLeave={event => {
                    if (!event.currentTarget.contains(document.activeElement)) commandRegistry.clearActivePanel(panelName);
                }}
                onFocusCapture={() => commandRegistry.setActivePanel(panelName)}
                sx={{ width: 1, height: type === 'overlay' ? 'auto' : 1, display: 'flex', flexDirection: 'column',
                      overflow: 'hidden', ...frames[type], color: tokens.text, colorScheme: tokens.base,
                      scrollbarColor: `${tokens.scrollbarThumb} transparent`,
                      '&:hover .panel-header-action': { opacity: 0.85 }, ...props.sx }}>
        <Box ref={headerRef} className="drag-handle"
             sx={{ height: tokens.px(SHAPE.panelHeaderHeight), flexShrink: 0, display: 'flex', alignItems: 'center',
                   gap: 0.25, pl: 1.5, pr: 0.75, color: chrome?.text ?? tokens.text, backgroundColor: chrome?.fill,
                   cursor: 'grab',
                   borderBottom: showBody && type !== 'borderless' ? `1px solid ${tokens.border}` : 'none',
                   '&:active': { cursor: 'grabbing' } }}>
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
            {type === 'regular' && (
                <Tooltip title={withShortcut('Fit to content', 'panel.fit')}>
                    <IconButton size="small" aria-label="fit to content" className="panel-header-action" sx={headerAction}
                                onClick={fitToContent}>
                        <FoldVertical {...icon} />
                    </IconButton>
                </Tooltip>
            )}
            {type !== 'borderless' && (
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
             sx={{ display: showBody ? 'flex' : 'none', flexDirection: 'column', flex: type === 'overlay' ? '0 1 auto' : 1,
                   minHeight: 0, m: type === 'borderless' ? 0 : 1.5, overflow: 'auto', justifyContent: 'flex-start',
                   alignItems: 'center' }}>
            {props.children}
        </Box>
    </Box>
});

export default Panel;
