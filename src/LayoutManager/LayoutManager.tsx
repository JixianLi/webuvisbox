// ABOUTME: Manages the responsive grid layout of scenario panels.
// ABOUTME: Renders the header bar, panel grid, and loading indicator.

import React, { useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";

import type { AppLayout, AppLayouts, InspectorAnchor, PanelLayouts, RGLBreakpoints } from "../Types/PanelLayouts";
import { useTheme } from "@mui/material/styles";
import HeaderBar from "./HeaderBar/HeaderBar";
import { SHAPE } from "../Theme/DesignTokens";
import { useScenario } from "../ScenarioManager/ScenarioManager";
import { scenarioRegistry } from "../Scenarios";
import { usePromiseTracker } from "react-promise-tracker";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { PanelPlacementContext } from "../Panels/PanelPlacement";
import { GRID_ROW_HEIGHT } from "../Panels/Panel";
// @ts-ignore
import { toJS } from "mobx";

// Use WidthProvider to get the correct container width for responsiveness
const ResponsiveGridLayout = WidthProvider(Responsive);

const LoadingIndicator = observer(function LoadingIndicator() {
    const { promiseInProgress } = usePromiseTracker()

    return promiseInProgress ? (
        <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 2000 }} />
    ) : null
});

const MIN_CONTENT_SHARE = 0.15;

// The same rule react-grid-layout applies: the largest breakpoint whose width the viewport exceeds.
function breakpointForWidth(breakpoints: RGLBreakpoints, width: number): string {
    const ascending = Object.entries(breakpoints).sort(([, low], [, high]) => low - high);
    let current = ascending[0][0];
    for (const [name, minimumWidth] of ascending) {
        if (width > minimumWidth) {
            current = name;
        }
    }
    return current;
}

// Inspector arrangement (tool_placement docked or overlay): the content panels share the area under the navbar side
// by side (one alone fills it, unframed), split by draggable dividers; the tool panels stack in one inspector column,
// each as tall as its content until the column is full, then each scrolls its own content. Docked, the inspector
// takes a strip on the anchor's side; overlay, it floats in the anchor's corner. Dragging a tool panel's title row moves the inspector, with the corner it will snap to outlined.
const InspectorArrangement = observer(({ panelLayouts }: { panelLayouts: PanelLayouts }) => {
    const scenario = useScenario();
    const tokens = useTheme().tokens;
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const inspectorRef = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<{ left: number; top: number; height: number; target: InspectorAnchor } | null>(null);
    const panelMapping = scenarioRegistry.get(scenario.name).panelMapping;
    const visiblePanels = panelLayouts.currentLayouts[panelLayouts.currentBreakpoint].filter(panel => panel.visible);
    const contentPanels = visiblePanels.filter(panel => panel.role === 'content');
    const toolPanels = visiblePanels.filter(panel => panel.role !== 'content');
    const gap = tokens.px(SHAPE.panelGap);
    const inset = tokens.px(12);
    const inspectorWidth = tokens.px(SHAPE.inspectorWidth);
    const docked = panelLayouts.currentToolPlacement === 'docked';
    const single = contentPanels.length === 1;
    const anchor = panelLayouts.inspectorAnchor;
    const onLeft = anchor.endsWith('left');
    // A single unframed content panel's title row spans the width: a top inspector starts below it.
    const topClearance = single ? tokens.px(SHAPE.panelHeaderHeight) : inset;
    const dockedStrip = docked && toolPanels.length > 0 ? inspectorWidth + 2 * inset : 0;
    const savedSplit = panelLayouts.contentSplit;
    const shares = savedSplit.length === contentPanels.length && savedSplit.every(share => share > 0)
        ? savedSplit : contentPanels.map(() => 1 / Math.max(1, contentPanels.length));

    const positionAt = (corner: InspectorAnchor) => ({
        ...(corner.endsWith('left') ? { left: inset } : { right: inset }),
        ...(docked ? { top: inset } : corner.startsWith('top') ? { top: topClearance } : { bottom: inset }),
    });

    const nearestCorner = (centerX: number, centerY: number, width: number, height: number): InspectorAnchor =>
        `${centerY < height / 2 ? 'top' : 'bottom'}_${centerX < width / 2 ? 'left' : 'right'}` as InspectorAnchor;

    const startInspectorDrag = (event: React.PointerEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.drag-handle') || target.closest('button') || !containerRef.current || !inspectorRef.current) {
            return;
        }
        const container = containerRef.current.getBoundingClientRect();
        const inspector = inspectorRef.current.getBoundingClientRect();
        const start = { x: event.clientX, y: event.clientY, left: inspector.left - container.left, top: inspector.top - container.top };
        const placeAt = (clientX: number, clientY: number) => {
            const left = start.left + clientX - start.x;
            const top = start.top + clientY - start.y;
            const target = nearestCorner(left + inspector.width / 2, top + inspector.height / 2, container.width, container.height);
            return { left, top, height: inspector.height, target };
        };
        const move = (moveEvent: PointerEvent) => setDrag(placeAt(moveEvent.clientX, moveEvent.clientY));
        const release = (upEvent: PointerEvent) => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', release);
            panelLayouts.setInspectorAnchor(placeAt(upEvent.clientX, upEvent.clientY).target);
            setDrag(null);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', release);
        event.preventDefault();
    };

    // Dragging the divider before panel `index` moves width between it and its left neighbor.
    const startSplitDrag = (index: number) => (event: React.PointerEvent) => {
        if (!contentRef.current) {
            return;
        }
        const usableWidth = contentRef.current.getBoundingClientRect().width - gap * (contentPanels.length - 1);
        const startX = event.clientX;
        const startShares = [...shares];
        const move = (moveEvent: PointerEvent) => {
            const pair = startShares[index - 1] + startShares[index];
            const left = Math.min(pair - MIN_CONTENT_SHARE,
                                  Math.max(MIN_CONTENT_SHARE, startShares[index - 1] + (moveEvent.clientX - startX) / usableWidth));
            const next = [...startShares];
            next[index - 1] = left;
            next[index] = pair - left;
            panelLayouts.setContentSplit(next);
        };
        const release = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', release);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', release);
        event.preventDefault();
    };

    const dividerLine = { content: '""', position: 'absolute', top: '45%', bottom: '45%', left: '50%', width: 3,
                          transform: 'translateX(-50%)', borderRadius: 2, backgroundColor: tokens.textMuted, opacity: 0.5 };

    return <Box ref={containerRef}
                sx={{ position: 'relative', height: `calc(100vh - ${tokens.px(SHAPE.navbarHeight)}px)`, overflow: 'hidden' }}>
        <Box ref={contentRef}
             sx={{ position: 'absolute', top: single ? 0 : gap, bottom: single ? 0 : gap,
                   left: (onLeft ? dockedStrip : 0) + (single ? 0 : gap),
                   right: (onLeft ? 0 : dockedStrip) + (single ? 0 : gap), display: 'flex' }}>
            {contentPanels.map((panel, index) => (
                <React.Fragment key={panel.i}>
                    {index > 0 && (
                        <Box onPointerDown={startSplitDrag(index)} aria-label="resize"
                             sx={{ width: gap, flexShrink: 0, position: 'relative', cursor: 'col-resize',
                                   '&::after': dividerLine, '&:hover::after': { opacity: 1, backgroundColor: tokens.accentOnSurface } }} />
                    )}
                    <Box sx={{ flex: `${shares[index]} 1 0`, minWidth: 0, minHeight: 0 }}>
                        <PanelPlacementContext.Provider value={single ? 'stage' : 'content'}>{panelMapping(panel.i)}</PanelPlacementContext.Provider>
                    </Box>
                </React.Fragment>
            ))}
        </Box>
        {drag && (
            <Box sx={{ position: 'absolute', width: inspectorWidth, height: drag.height, ...positionAt(drag.target),
                       border: `2px dashed ${tokens.accentOnSurface}`, borderRadius: `${tokens.px(12)}px`,
                       backgroundColor: 'rgba(127, 127, 127, 0.08)', pointerEvents: 'none' }} />
        )}
        <Box ref={inspectorRef} onPointerDown={startInspectorDrag}
             sx={{ position: 'absolute', width: inspectorWidth, zIndex: 1,
                   ...(drag ? { left: drag.left, top: drag.top, opacity: 0.85,
                                maxHeight: `calc(100% - ${Math.max(0, drag.top) + inset}px)` }
                            : { ...positionAt(anchor), maxHeight: `calc(100% - ${topClearance + inset}px)` }),
                   overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: `${gap}px`,
                   '& .drag-handle': { cursor: drag ? 'grabbing' : 'grab' } }}>
            {toolPanels.map(panel => (
                <PanelPlacementContext.Provider key={panel.i} value="floating">{panelMapping(panel.i)}</PanelPlacementContext.Provider>
            ))}
        </Box>
    </Box>;
});

// Each content panel is this share of the viewport height, so the first tool panel's title peeks in below it and
// shows that the page scrolls.
const STACKED_CONTENT_HEIGHT = '75vh';

// Stacked placement (meant for phones): one full-width column that the page scrolls. Content panels first, each STACKED_CONTENT_HEIGHT
// tall, then the tool panels at their natural height (no nested scroll areas, which are awkward on touch screens).
const StackedArrangement = observer(({ panelLayouts }: { panelLayouts: PanelLayouts }) => {
    const scenario = useScenario();
    const tokens = useTheme().tokens;
    const panelMapping = scenarioRegistry.get(scenario.name).panelMapping;
    const visiblePanels = panelLayouts.currentLayouts[panelLayouts.currentBreakpoint].filter(panel => panel.visible);
    const contentPanels = visiblePanels.filter(panel => panel.role === 'content');
    const toolPanels = visiblePanels.filter(panel => panel.role !== 'content');
    const gap = tokens.px(SHAPE.panelGap);
    const single = contentPanels.length === 1;
    return <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, pb: `${gap}px` }}>
        {contentPanels.map(panel => (
            <Box key={panel.i} sx={{ height: STACKED_CONTENT_HEIGHT, minHeight: 0, mx: single ? 0 : `${gap}px` }}>
                <PanelPlacementContext.Provider value={single ? 'stage' : 'content'}>{panelMapping(panel.i)}</PanelPlacementContext.Provider>
            </Box>
        ))}
        {toolPanels.map(panel => (
            <Box key={panel.i} sx={{ mx: `${gap}px` }}>
                <PanelPlacementContext.Provider value="floating">{panelMapping(panel.i)}</PanelPlacementContext.Provider>
            </Box>
        ))}
    </Box>;
});

const LayoutManager: React.FC = observer(() => {
    const scenario = useScenario();
    const panelLayouts: PanelLayouts = scenario.panelLayouts!;
    const theme = useTheme();
    // The grid reports breakpoint changes itself, but the other placements need them too (tool_placement can differ
    // per breakpoint). Layout effect: on a phone the first paint already uses the small breakpoint's placement.
    useLayoutEffect(() => {
        if (!panelLayouts) {
            return;
        }
        const update = () => panelLayouts.setCurrentBreakpoint(breakpointForWidth(panelLayouts.breakpoints, window.innerWidth));
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [panelLayouts]);

    if (!scenario.fullyLoaded) {
        return <div style={{ width: '100vw', height: '100vh', backgroundColor: theme.palette.background.default }}>
            <HeaderBar />
        </div>;
    }
    const currentLayouts = panelLayouts.currentLayouts;

    const onLayoutChange = (_: AppLayout[], allLayouts: AppLayouts) => {
        panelLayouts.setCurrentLayout(allLayouts);
    };

    const onBreakpointChange = (newBreakpoint: string) => {
        panelLayouts.setCurrentBreakpoint(newBreakpoint);
    };

    const layoutPanels = () => {
        const panelMapping = scenarioRegistry.get(scenario.name).panelMapping;
        const breakpoint = panelLayouts.currentBreakpoint;
        const layout = panelLayouts.currentLayouts[breakpoint];
        return layout.map((panel) => {
            return panel.visible ? (
                <div key={panel.i}>
                    {panelMapping(panel.i)}
                </div>
            ) : <div key={panel.i} />;
        });
    };

    const toolPlacement = panelLayouts.currentToolPlacement;

    if (toolPlacement === 'stacked') {
        return <div style={{ width: '100%', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
            <HeaderBar />
            <StackedArrangement panelLayouts={panelLayouts} />
            <LoadingIndicator />
        </div>;
    }

    if (toolPlacement !== 'grid') {
        return <div style={{ width: '100vw', height: '100vh', backgroundColor: theme.palette.background.default }}>
            <HeaderBar />
            <InspectorArrangement panelLayouts={panelLayouts} />
            <LoadingIndicator />
        </div>;
    }

    const gap = theme.tokens.px(SHAPE.panelGap);
    return <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <HeaderBar />
        <ResponsiveGridLayout
            className="layout"
            layouts={currentLayouts}
            breakpoints={panelLayouts.breakpoints}
            cols={panelLayouts.cols}
            rowHeight={GRID_ROW_HEIGHT}
            onBreakpointChange={onBreakpointChange}
            onLayoutChange={onLayoutChange}
            draggableHandle={".drag-handle"}
            margin={[gap, gap]}
            containerPadding={[gap, gap]}
        >
            {layoutPanels()}
        </ResponsiveGridLayout>
        <LoadingIndicator />
    </div>
});


export default LayoutManager;
