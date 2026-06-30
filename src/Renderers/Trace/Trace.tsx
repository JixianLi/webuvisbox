// ABOUTME: Sequence-diagram (swim-lane) renderer for actor-to-actor message traces.
// ABOUTME: Pure presentational SVG; supports self-loops for retries and click-to-select.

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { TraceMarker } from "./TraceMarker";

export type Actor = {
    id: string;
    label: string;
    kind?: "user" | "model" | "tool";
};

export type TraceMessage = {
    id: string;
    from: string;
    to: string;
    payload: unknown;
    kind?: string;
    t?: number;
};

export type TraceProps = {
    actors: Actor[];
    messages: TraceMessage[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
    fontSize?: number;
};

const LANE_WIDTH = 140;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 50;
const TOP_PAD = 16;
const SELF_LOOP_OFFSET = 30;
const HIT_STROKE = 24;
const SHAFT_WIDTH = 3.5;
const SELECT_STROKE_BUMP = 3;

export function Trace({ actors, messages, selectedId, onSelect, fontSize = 13 }: TraceProps) {
    const theme = useTheme();
    const labelSize = Math.max(fontSize - 2, 8);

    const indexOf = (id: string) => actors.findIndex((a) => a.id === id);
    const laneX = (id: string) => indexOf(id) * LANE_WIDTH + LANE_WIDTH / 2;

    const colorFor = (kind?: string) => {
        switch (kind) {
            case "prompt": return theme.palette.primary.main;
            case "tool_call": return theme.palette.warning.main;
            case "tool_result": return theme.palette.success.main;
            case "retry": return theme.palette.secondary.main;
            case "error": return theme.palette.error.main;
            default: return theme.palette.text.primary;
        }
    };

    const usedKinds = useMemo(() => {
        const set = new Set<string>();
        messages.forEach((m) => set.add(m.kind || "default"));
        set.add("default");
        return Array.from(set);
    }, [messages]);

    const width = Math.max(actors.length * LANE_WIDTH, 1);
    const height = HEADER_HEIGHT + TOP_PAD + Math.max(messages.length, 1) * ROW_HEIGHT + TOP_PAD;

    const selected = selectedId ? messages.find((m) => m.id === selectedId) : null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
            <Box sx={{ flex: 1, overflow: "auto", p: 1, minHeight: 0 }}>
                <svg
                    width={width}
                    height={height}
                    onClick={() => onSelect?.(null)}
                    style={{ display: "block" }}
                >
                    <defs>
                        {usedKinds.map((k) => (
                            <TraceMarker
                                key={k}
                                id={`trace-arrow-${k}`}
                                length={13}
                                width={15}
                                color={colorFor(k === "default" ? undefined : k)}
                            />
                        ))}
                    </defs>

                    {actors.map((actor) => (
                        <line
                            key={`lifeline-${actor.id}`}
                            x1={laneX(actor.id)}
                            y1={HEADER_HEIGHT}
                            x2={laneX(actor.id)}
                            y2={height}
                            stroke={theme.palette.divider}
                            strokeDasharray="4 4"
                        />
                    ))}

                    {actors.map((actor) => (
                        <g key={`header-${actor.id}`}>
                            <rect
                                x={indexOf(actor.id) * LANE_WIDTH + 10}
                                y={5}
                                width={LANE_WIDTH - 20}
                                height={HEADER_HEIGHT - 10}
                                fill={theme.palette.action.hover}
                                stroke={theme.palette.divider}
                                rx={4}
                            />
                            <text
                                x={laneX(actor.id)}
                                y={HEADER_HEIGHT / 2 + 5}
                                textAnchor="middle"
                                fill={theme.palette.text.primary}
                                fontSize={fontSize}
                                fontWeight="500"
                            >
                                {actor.label}
                            </text>
                        </g>
                    ))}

                    {messages.map((msg, idx) => {
                        const y = HEADER_HEIGHT + TOP_PAD + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
                        const color = colorFor(msg.kind);
                        const isSelected = msg.id === selectedId;
                        const strokeWidth = isSelected ? SHAFT_WIDTH + SELECT_STROKE_BUMP : SHAFT_WIDTH;
                        const markerId = `trace-arrow-${msg.kind || "default"}`;
                        const handleClick = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            onSelect?.(msg.id);
                        };

                        if (msg.from === msg.to) {
                            const x = laneX(msg.from);
                            const path = `M ${x} ${y - 12} C ${x + SELF_LOOP_OFFSET} ${y - 12}, ${x + SELF_LOOP_OFFSET} ${y + 12}, ${x} ${y + 12}`;
                            return (
                                <g key={msg.id} style={{ cursor: "pointer" }} onClick={handleClick}>
                                    <path d={path} fill="none" stroke="transparent" strokeWidth={HIT_STROKE} />
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={strokeWidth}
                                        markerEnd={`url(#${markerId})`}
                                    />
                                    {msg.kind && (
                                        <text
                                            x={x + SELF_LOOP_OFFSET + 6}
                                            y={y + 4}
                                            fontSize={labelSize}
                                            fill={theme.palette.text.secondary}
                                        >
                                            {msg.kind}
                                        </text>
                                    )}
                                </g>
                            );
                        }

                        const x1 = laneX(msg.from);
                        const x2 = laneX(msg.to);
                        return (
                            <g key={msg.id} style={{ cursor: "pointer" }} onClick={handleClick}>
                                <line x1={x1} y1={y} x2={x2} y2={y} stroke="transparent" strokeWidth={HIT_STROKE} />
                                <line
                                    x1={x1}
                                    y1={y}
                                    x2={x2}
                                    y2={y}
                                    stroke={color}
                                    strokeWidth={strokeWidth}
                                    markerEnd={`url(#${markerId})`}
                                />
                                {msg.kind && (
                                    <text
                                        x={(x1 + x2) / 2}
                                        y={y - 6}
                                        textAnchor="middle"
                                        fontSize={labelSize}
                                        fill={theme.palette.text.secondary}
                                    >
                                        {msg.kind}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </Box>

            {selected && (
                <Box sx={{ flex: "0 0 auto", maxHeight: "35%", overflow: "auto", p: 1, borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        {selected.from} → {selected.to}{selected.kind ? ` · ${selected.kind}` : ""}
                    </Typography>
                    <Box
                        component="pre"
                        sx={{ fontSize: labelSize, m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}
                    >
                        {typeof selected.payload === "string"
                            ? selected.payload
                            : JSON.stringify(selected.payload, null, 2)}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default Trace;
