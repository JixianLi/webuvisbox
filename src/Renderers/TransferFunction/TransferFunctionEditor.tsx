// ABOUTME: A piecewise-linear transfer-function editor in the style of ParaView's: an opacity curve over the data's
// ABOUTME: histogram, filled with the colormap, and a color strip with movable color points beneath it.

import { useId, useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type OpacityMap from "../Colormaps/OpacityMap";
import type PresetLinearColormap from "../Colormaps/PresetLinearColormap";
import { LazyTextField } from "../../Panels/Lazyfields";

export interface TransferFunctionEditorProps {
    colormap: PresetLinearColormap;
    opacityMap: OpacityMap;
    valueRange: [number, number];       // data values at positions 0 and 1 of both maps
    histogram?: ArrayLike<number>;      // counts in equal bins over valueRange, drawn on a log scale
}

type Selection = { kind: "opacity" | "color"; index: number } | null;

const MARGIN = { left: 10, right: 10, top: 8 };
const COLOR_STRIP_HEIGHT = 16;
const COLOR_HANDLE_HEIGHT = 12;
const AXIS_HEIGHT = 18;
const POINT_RADIUS = 5;
const HIT_RADIUS = 14;             // touch-sized target around each point
// Sampled presets (Viridis, Inferno, …) have up to 256 color points: too dense for handles. Above this many, handles
// are hidden and the colormap can be resampled to SIMPLIFIED_COLOR_POINTS editable points.
const MAX_COLOR_HANDLES = 32;
const SIMPLIFIED_COLOR_POINTS = 8;

function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return [ref, size] as const;
}

function toHex([red, green, blue]: number[]) {
    return d3.rgb(red * 255, green * 255, blue * 255).formatHex();
}

function fromHex(hex: string): number[] {
    const color = d3.rgb(hex);
    return [color.r / 255, color.g / 255, color.b / 255];
}

// The index a point inserted at position lands at (the maps keep their points sorted).
function insertedIndex(points: number[], position: number) {
    return points.findIndex(point => point === position);
}

// A new point must lie strictly inside (0, 1), where the endpoints are, and not on top of an existing point.
function canInsert(points: number[], position: number) {
    return position > 1e-3 && position < 1 - 1e-3 && points.every(point => Math.abs(point - position) > 1e-3);
}

export const TransferFunctionEditor = observer(function TransferFunctionEditor(props: TransferFunctionEditorProps) {
    const { colormap, opacityMap, valueRange, histogram } = props;
    const tokens = useTheme().tokens;
    const gradientId = useId();
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [containerRef, size] = useElementSize<HTMLDivElement>();
    const [selection, setSelection] = useState<Selection>(null);
    const dragging = useRef<Selection>(null);

    const opacityPositions = opacityMap.opacityControlPoints;
    const opacityValues = opacityMap.opacityValues;
    const colorPositions = colormap.colorControlPoints;
    const colorValues = colormap.colorPoints;
    const selectionValid = selection !== null
        && selection.index < (selection.kind === "opacity" ? opacityPositions.length : colorPositions.length);
    const selected = selectionValid ? selection : null;
    const colorsEditable = colorPositions.length <= MAX_COLOR_HANDLES;

    const plotBottom = Math.max(MARGIN.top + 20, size.height - COLOR_STRIP_HEIGHT - COLOR_HANDLE_HEIGHT - AXIS_HEIGHT - 6);
    const stripTop = plotBottom + 4;
    const x = d3.scaleLinear().domain([0, 1]).range([MARGIN.left, Math.max(MARGIN.left + 1, size.width - MARGIN.right)]).clamp(true);
    const y = d3.scaleLinear().domain([0, 1]).range([plotBottom, MARGIN.top]).clamp(true);
    const toData = d3.scaleLinear().domain([0, 1]).range(valueRange);

    const opacityPoints = opacityPositions.map((position, index) => [position, opacityValues[index]] as [number, number]);
    const curve = d3.line().x(point => x(point[0])).y(point => y(point[1]))(opacityPoints) ?? "";
    const area = d3.area().x(point => x(point[0])).y0(plotBottom).y1(point => y(point[1]))(opacityPoints) ?? "";

    const histogramBars = (() => {
        if (!histogram || histogram.length === 0) return null;
        const counts = Array.from(histogram);
        const top = Math.log1p(Math.max(...counts, 1));
        const binWidth = 1 / counts.length;
        return counts.map((count, bin) => {
            const height = (Math.log1p(count) / top) * (plotBottom - MARGIN.top);
            return <rect key={bin} x={x(bin * binWidth)} width={Math.max(0, x((bin + 1) * binWidth) - x(bin * binWidth))}
                         y={plotBottom - height} height={height} fill={tokens.textMuted} fillOpacity={0.28} />;
        });
    })();

    const pointerPosition = (event: React.PointerEvent) => {
        const bounds = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
        return { position: x.invert(event.clientX - bounds.left), opacity: y.invert(event.clientY - bounds.top) };
    };

    const startDrag = (event: React.PointerEvent, target: Selection) => {
        (event.currentTarget as SVGGraphicsElement).ownerSVGElement?.setPointerCapture(event.pointerId);
        dragging.current = target;
        setSelection(target);
    };

    const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        const { position, opacity } = pointerPosition(event);
        const bounds = event.currentTarget.getBoundingClientRect();
        const inStrip = event.clientY - bounds.top >= stripTop;
        event.currentTarget.setPointerCapture(event.pointerId);
        if (inStrip) {
            if (!colorsEditable || !canInsert(colormap.colorControlPoints, position)) return;
            colormap.addColorControlPoint(position);
            const index = insertedIndex(colormap.colorControlPoints, position);
            dragging.current = index > 0 ? { kind: "color", index } : null;
            setSelection(dragging.current);
        } else {
            if (!canInsert(opacityMap.opacityControlPoints, position)) return;
            opacityMap.addOpacityControlPoint(position, opacity);
            const index = insertedIndex(opacityMap.opacityControlPoints, position);
            dragging.current = index > 0 ? { kind: "opacity", index } : null;
            setSelection(dragging.current);
        }
    };

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const target = dragging.current;
        if (!target) return;
        const { position, opacity } = pointerPosition(event);
        if (target.kind === "opacity") opacityMap.setOpacityControlPoint(target.index, position, opacity);
        else colormap.setColorControlPoint(target.index, position);
    };

    const endDrag = () => { dragging.current = null; };

    const removeSelected = () => {
        if (!selected) return;
        if (selected.kind === "opacity") opacityMap.removeOpacityControlPoint(selected.index);
        else colormap.removeColorControlPoint(selected.index);
        setSelection(null);
    };

    const isEndpoint = selected !== null
        && (selected.index === 0 || selected.index === (selected.kind === "opacity" ? opacityPositions : colorPositions).length - 1);
    const valueTicks = toData.ticks(5);
    const formatTick = toData.tickFormat(5);
    // Enough digits that committing the field unchanged does not move the point.
    const formatValue = d3.format(".4~g");
    const selectedPosition = selected ? (selected.kind === "opacity" ? opacityPositions : colorPositions)[selected.index] : 0;
    const numberText = (text: string) => text.trim() !== "" && Number.isFinite(Number(text));

    return (
        <Box sx={{ width: 1, height: 1, display: "flex", flexDirection: "column", gap: 1, minHeight: 0 }}>
            <Box ref={containerRef} sx={{ flex: 1, minHeight: 90, position: "relative" }}>
                {size.width > 0 && (
                    <svg width={size.width} height={size.height} tabIndex={0} role="application"
                         aria-label="Transfer function editor: opacity curve and color points"
                         style={{ position: "absolute", inset: 0, touchAction: "none", outline: "none", cursor: "crosshair" }}
                         onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
                         onPointerUp={endDrag} onPointerCancel={endDrag}
                         onKeyDown={event => { if (event.key === "Delete" || event.key === "Backspace") removeSelected(); }}>
                        <defs>
                            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x(0)} x2={x(1)} y1={0} y2={0}>
                                {colorPositions.map((position, index) => (
                                    <stop key={index} offset={position} stopColor={toHex(colorValues[index])} />
                                ))}
                            </linearGradient>
                        </defs>
                        <rect x={x(0)} y={MARGIN.top} width={x(1) - x(0)} height={plotBottom - MARGIN.top}
                              fill="none" stroke={tokens.border} />
                        {histogramBars}
                        <path d={area} fill={`url(#${gradientId})`} fillOpacity={0.75} />
                        <path d={curve} fill="none" stroke={tokens.text} strokeWidth={1.5} />
                        {opacityPoints.map(([position, opacity], index) => {
                            const isSelected = selected?.kind === "opacity" && selected.index === index;
                            return (
                                <g key={index} transform={`translate(${x(position)},${y(opacity)})`} style={{ cursor: "grab" }}
                                   onPointerDown={event => { event.stopPropagation(); startDrag(event, { kind: "opacity", index }); }}>
                                    <circle r={HIT_RADIUS} fill="transparent" />
                                    <circle r={POINT_RADIUS} fill={isSelected ? tokens.accentOnSurface : tokens.surface}
                                            stroke={tokens.text} strokeWidth={1.5} />
                                </g>
                            );
                        })}
                        <rect x={x(0)} y={stripTop} width={x(1) - x(0)} height={COLOR_STRIP_HEIGHT} rx={3}
                              fill={`url(#${gradientId})`} stroke={tokens.border} />
                        {colorsEditable && colorPositions.map((position, index) => {
                            const isSelected = selected?.kind === "color" && selected.index === index;
                            const handleTop = stripTop + COLOR_STRIP_HEIGHT + 2;
                            return (
                                <g key={index} transform={`translate(${x(position)},${handleTop})`} style={{ cursor: "grab" }}
                                   onPointerDown={event => { event.stopPropagation(); startDrag(event, { kind: "color", index }); }}
                                   onDoubleClick={() => colorInputRef.current?.click()}>
                                    <rect x={-HIT_RADIUS} y={-COLOR_STRIP_HEIGHT - 2} width={2 * HIT_RADIUS}
                                          height={COLOR_STRIP_HEIGHT + COLOR_HANDLE_HEIGHT + 4} fill="transparent" />
                                    <path d={`M0,0L5,5V${COLOR_HANDLE_HEIGHT}H-5V5Z`} fill={toHex(colorValues[index])}
                                          stroke={isSelected ? tokens.accentOnSurface : tokens.text} strokeWidth={isSelected ? 2 : 1} />
                                </g>
                            );
                        })}
                        {valueTicks.map(tick => (
                            <text key={tick} x={x(toData.invert(tick))} y={size.height - 4} fontSize={tokens.px(11)}
                                  fill={tokens.textSecondary} textAnchor="middle">{formatTick(tick)}</text>
                        ))}
                    </svg>
                )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40, flexWrap: "wrap" }}>
                {selected === null && !colorsEditable && (
                    <Button size="small" variant="outlined" onClick={() => {
                        const positions = d3.range(SIMPLIFIED_COLOR_POINTS).map(index => index / (SIMPLIFIED_COLOR_POINTS - 1));
                        const colors = positions.map(position => {
                            const color = colormap.getColorByValue(position);
                            return [color.r / 255, color.g / 255, color.b / 255];
                        });
                        colormap.setControlPoints(positions, colors);
                    }}>
                        {`Simplify to ${SIMPLIFIED_COLOR_POINTS} color points`}
                    </Button>
                )}
                {selected === null ? (
                    <Typography variant="caption" sx={{ color: "text.secondary", flex: 1, minWidth: 200 }}>
                        Click or tap to add a point (above the strip: opacity; on it: color). Drag to move. Select a
                        point to type its value; Delete removes it. Double-click a color point to change its color.
                    </Typography>
                ) : (
                    <>
                        <LazyTextField size="small" label="Value" sx={{ width: 110 }} disabled={isEndpoint}
                                       key={`value-${selected.kind}-${selected.index}-${selectedPosition}`}
                                       defaultValue={formatValue(toData(selectedPosition))} validate={numberText}
                                       onBlur={event => {
                                           const position = toData.invert(Number(event.target.value));
                                           if (selected.kind === "opacity") {
                                               opacityMap.setOpacityControlPoint(selected.index, position, opacityValues[selected.index]);
                                           } else {
                                               colormap.setColorControlPoint(selected.index, position);
                                           }
                                       }} />
                        {selected.kind === "opacity" ? (
                            <LazyTextField size="small" label="Opacity" sx={{ width: 90 }}
                                           key={`opacity-${selected.index}-${opacityValues[selected.index]}`}
                                           defaultValue={opacityValues[selected.index].toFixed(3)} validate={numberText}
                                           onBlur={event => opacityMap.setOpacityControlPoint(
                                               selected.index, opacityPositions[selected.index], Number(event.target.value))} />
                        ) : (
                            <Button size="small" variant="outlined" onClick={() => colorInputRef.current?.click()}
                                    startIcon={<Box sx={{ width: 14, height: 14, borderRadius: "3px", border: `1px solid ${tokens.border}`,
                                                          backgroundColor: toHex(colorValues[selected.index]) }} />}>
                                Color
                            </Button>
                        )}
                        <Button size="small" onClick={removeSelected} disabled={isEndpoint}>Remove point</Button>
                    </>
                )}
                <input ref={colorInputRef} type="color" aria-label="Color of the selected point"
                       style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
                       value={selected?.kind === "color" ? toHex(colorValues[selected.index]) : "#000000"}
                       onChange={event => {
                           if (selected?.kind === "color") {
                               colormap.setColorControlPoint(selected.index, colorPositions[selected.index], fromHex(event.target.value));
                           }
                       }} />
            </Box>
        </Box>
    );
});

export default TransferFunctionEditor;
