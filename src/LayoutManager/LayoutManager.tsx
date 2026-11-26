// ABOUTME: Manages the responsive grid layout of scenario panels: regular and borderless panels in the grid, overlay
// ABOUTME: panels floating above it on the same grid coordinates. Renders the header bar and loading indicator.

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Responsive, type Layout, type ResponsiveLayouts } from "react-grid-layout/legacy";

import type { AppLayout, AppLayouts, PanelLayouts, RGLBreakpoints } from "../Types/PanelLayouts";
import { useTheme, type Theme } from "@mui/material/styles";
import HeaderBar from "./HeaderBar/HeaderBar";
import { SHAPE } from "../Theme/DesignTokens";
import { useScenario } from "../ScenarioManager/ScenarioManager";
import { scenarioRegistry } from "../Scenarios";
import { usePromiseTracker } from "react-promise-tracker";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { ErrorBoundary, ErrorFallback } from "../Panels/ErrorBoundary";

const LoadingIndicator = observer(function LoadingIndicator() {
    const { promiseInProgress } = usePromiseTracker()

    return promiseInProgress ? (
        <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 2000 }} />
    ) : null
});

// The same rule react-grid-layout applies: the largest breakpoint whose width the grid exceeds.
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

// Grid geometry, matching react-grid-layout's: with padding p and margin m on both axes,
//     columnWidth = (gridWidth − 2p − (cols − 1)·m) / cols
//     a cell at (x, y) of size (w, h) spans left = p + x·(columnWidth + m), top = p + y·(rowHeight + m),
//     width = w·columnWidth + (w − 1)·m, height = h·rowHeight + (h − 1)·m
// and, solving the height for rowHeight, fitRows rows exactly fill a viewport of height H:
//     rowHeight = (H − 2p − (fitRows − 1)·m) / fitRows
interface GridGeometry { columnWidth: number; rowHeight: number; gap: number }

// Where a dragged panel will land: dashed accent outline, faint fill. Theme-dependent, so styled here rather than in
// App.css.
function dropOutline(tokens: Theme["tokens"]) {
    return { border: `2px dashed ${tokens.accentOnSurface}`, borderRadius: `${tokens.px(SHAPE.panelRadius)}px`,
             backgroundColor: 'rgba(127, 127, 127, 0.08)' };
}

function cellBox(geometry: GridGeometry, panel: { x: number; y: number; w: number; h: number }) {
    const { columnWidth, rowHeight, gap } = geometry;
    return {
        left: gap + panel.x * (columnWidth + gap),
        top: gap + panel.y * (rowHeight + gap),
        width: panel.w * columnWidth + (panel.w - 1) * gap,
        height: panel.h * rowHeight + (panel.h - 1) * gap,
    };
}

// Overlay panels: glass, above the grid, as tall as their content up to h rows. Dragging the title row moves one;
// on release it snaps to the nearest cell (outlined while dragging), so overlays keep grid coordinates like every other
// panel.
const OverlayLayer = observer(({ panelLayouts, geometry, cols }:
                                { panelLayouts: PanelLayouts; geometry: GridGeometry; cols: number }) => {
    const scenario = useScenario();
    const tokens = useTheme().tokens;
    const panelMapping = scenarioRegistry.get(scenario.name).panelMapping;
    const [drag, setDrag] = useState<{ panelId: string; dx: number; dy: number; height: number } | null>(null);
    const endDragRef = useRef<(() => void) | null>(null);
    useEffect(() => () => endDragRef.current?.(), []);
    const overlays = panelLayouts.currentLayouts[panelLayouts.currentBreakpoint]
        .filter(panel => panel.visible && panel.type === 'overlay');

    const snappedCell = (panel: AppLayout, dx: number, dy: number) => {
        const x = Math.round(panel.x + dx / (geometry.columnWidth + geometry.gap));
        const y = Math.round(panel.y + dy / (geometry.rowHeight + geometry.gap));
        return { ...panel, x: Math.min(Math.max(0, x), cols - panel.w), y: Math.max(0, y) };
    };

    const startDrag = (panel: AppLayout) => (event: React.PointerEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.drag-handle') || target.closest('button')) {
            return;
        }
        const start = { x: event.clientX, y: event.clientY };
        const height = (event.currentTarget as HTMLElement).offsetHeight;
        const offsetOf = (clientX: number, clientY: number) => ({ dx: clientX - start.x, dy: clientY - start.y });
        const move = (moveEvent: PointerEvent) => setDrag({ panelId: panel.i, height,
                                                                       ...offsetOf(moveEvent.clientX, moveEvent.clientY) });
        const stopListening = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', release);
            window.removeEventListener('pointercancel', cancel);
            endDragRef.current = null;
        };
        const release = (upEvent: PointerEvent) => {
            stopListening();
            const { dx, dy } = offsetOf(upEvent.clientX, upEvent.clientY);
            const target = snappedCell(panel, dx, dy);
            panelLayouts.movePanel(panel.i, target.x, target.y);
            setDrag(null);
        };
        // The browser cancels the pointer when it takes the gesture over (a touch turning into a scroll): the panel
        // goes back to where it was.
        const cancel = () => {
            stopListening();
            setDrag(null);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', cancel);
        endDragRef.current = stopListening;
        event.preventDefault();
    };

    const draggedPanel = drag ? overlays.find(panel => panel.i === drag.panelId) : undefined;
    const outline = drag && draggedPanel ? cellBox(geometry, snappedCell(draggedPanel, drag.dx, drag.dy)) : null;

    return <>
        {outline && drag && (
            <Box sx={{ position: 'absolute', left: outline.left, top: outline.top, width: outline.width, height: drag.height,
                       zIndex: 2, pointerEvents: 'none', ...dropOutline(tokens) }} />
        )}
        {overlays.map(panel => {
            const box = cellBox(geometry, panel);
            const dragged = drag?.panelId === panel.i;
            return (
                <Box key={panel.i} onPointerDown={startDrag(panel)}
                     sx={{ position: 'absolute', left: box.left + (dragged ? drag.dx : 0), top: box.top + (dragged ? drag.dy : 0),
                           width: box.width, maxHeight: box.height, display: 'flex', flexDirection: 'column',
                           zIndex: dragged ? 3 : 2, opacity: dragged ? 0.85 : 1,
                           '& .drag-handle': { cursor: dragged ? 'grabbing' : 'grab' } }}>
                    <ErrorBoundary resetKey={scenario.generation}
                                   fallback={error => <ErrorFallback title={`Panel "${panel.i}" failed`} error={error} />}>
                        {panelMapping(panel.i)}
                    </ErrorBoundary>
                </Box>
            );
        })}
    </>;
});

const LayoutManager: React.FC = observer(() => {
    const scenario = useScenario();
    const panelLayouts: PanelLayouts = scenario.panelLayouts!;
    const theme = useTheme();
    const gridRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });

    // The grid's own width (not the window's) picks the breakpoint, as react-grid-layout does; the window's height
    // minus the navbar is what fit_rows fills.
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) {
            return;
        }
        // documentElement.clientHeight, not innerHeight: on phones innerHeight changes as the browser bar slides away while
        // scrolling, which would resize every row mid-scroll.
        const measure = () => {
            const next = { width: grid.clientWidth,
                           height: document.documentElement.clientHeight - (grid.getBoundingClientRect().top + window.scrollY) };
            setViewport(current => current.width === next.width && current.height === next.height ? current : next);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(grid);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [scenario.fullyLoaded, scenario.generation]);

    const gap = theme.tokens.px(SHAPE.panelGap);
    const breakpoint = panelLayouts && viewport.width > 0 ? breakpointForWidth(panelLayouts.breakpoints, viewport.width) : null;
    const rowHeight = breakpoint ? Math.max(1, (viewport.height - 2 * gap - (panelLayouts.fitRowsAt(breakpoint) - 1) * gap)
                                                / panelLayouts.fitRowsAt(breakpoint)) : 0;

    useLayoutEffect(() => {
        if (breakpoint) {
            panelLayouts.setCurrentBreakpoint(breakpoint);
            panelLayouts.setRowHeight(rowHeight);
        }
    }, [panelLayouts, breakpoint, rowHeight]);

    if (!scenario.fullyLoaded) {
        return <div style={{ width: '100vw', height: '100vh', backgroundColor: theme.palette.background.default }}>
            <HeaderBar />
            <LoadingIndicator />
        </div>;
    }

    const onLayoutChange = (_: Layout, allLayouts: ResponsiveLayouts) => {
        panelLayouts.setCurrentLayout(allLayouts);
    };

    // Overlay panels stay out of the grid, so they neither take space nor push other panels.
    const gridLayouts: AppLayouts = Object.fromEntries(Object.entries(panelLayouts.currentLayouts)
        .map(([name, layout]) => [name, layout.filter(panel => panel.type !== 'overlay')]));
    const panelMapping = scenarioRegistry.get(scenario.name).panelMapping;
    const ready = breakpoint !== null && panelLayouts.currentBreakpoint === breakpoint;
    const cols = ready ? panelLayouts.cols[breakpoint] : 0;
    const geometry: GridGeometry = { columnWidth: (viewport.width - 2 * gap - (cols - 1) * gap) / Math.max(1, cols), rowHeight, gap };

    return <div style={{ width: '100%', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <HeaderBar />
        <Box key={scenario.generation} ref={gridRef} sx={{ position: 'relative',
                                 '& .react-grid-item.react-grid-placeholder': { ...dropOutline(theme.tokens), opacity: 1 } }}>
            {ready && <ErrorBoundary resetKey={scenario.generation}
                                     fallback={error => <ErrorFallback title={`The layout of "${scenario.name}" failed`} error={error} />}>
                <Responsive
                    className="layout"
                    width={viewport.width}
                    layouts={gridLayouts}
                    breakpoints={panelLayouts.breakpoints}
                    cols={panelLayouts.cols}
                    rowHeight={rowHeight}
                    onLayoutChange={onLayoutChange}
                    draggableHandle={".drag-handle"}
                    draggableCancel="button"
                    margin={[gap, gap]}
                    containerPadding={[gap, gap]}
                >
                    {gridLayouts[breakpoint].map(panel => panel.visible
                        ? <div key={panel.i}>
                              <ErrorBoundary resetKey={scenario.generation}
                                             fallback={error => <ErrorFallback title={`Panel "${panel.i}" failed`} error={error} />}>
                                  {panelMapping(panel.i)}
                              </ErrorBoundary>
                          </div>
                        : <div key={panel.i} />)}
                </Responsive>
                <OverlayLayer panelLayouts={panelLayouts} geometry={geometry} cols={cols} />
            </ErrorBoundary>}
        </Box>
        <LoadingIndicator />
    </div>
});


export default LayoutManager;
