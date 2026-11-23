// ABOUTME: SVG word cloud: placed words (from WordCloudLayout) scaled to fit, optional similarity links, hover and
// ABOUTME: click callbacks, and focus dimming (a hovered or selected word and its linked words stay at full opacity).

import { useTheme } from "@mui/material/styles";
import { layoutBounds, type PlacedWord } from "./WordCloudLayout";

export interface WordCloudLink {
    source: string;   // word keys
    target: string;
    similarity: number;
}

export interface WordCloudProps {
    words: PlacedWord[];
    colorOf: (key: string) => string;
    fontFamily: string;
    fontWeight: number;
    links?: WordCloudLink[];
    // Draw every link, or (default) only those of the focused word.
    showAllLinks?: boolean;
    selectedKey?: string | null;
    // The word whose neighborhood stays highlighted: usually the hovered word, else the selected one.
    focusKey?: string | null;
    onHover?: (key: string | null) => void;
    // Called with null when the background is clicked.
    onSelect?: (key: string | null) => void;
    padding?: number;
}

const FOCUS_DIMMED_OPACITY = 0.25;

export function WordCloud({
    words, colorOf, fontFamily, fontWeight, links = [], showAllLinks = false, selectedKey = null, focusKey = null,
    onHover, onSelect, padding = 12,
}: WordCloudProps) {
    const tokens = useTheme().tokens;
    const positionByKey = new Map(words.map(word => [word.key, word]));
    const bounds = layoutBounds(words);
    const viewBox = [bounds.x - padding, bounds.y - padding, bounds.width + 2 * padding, bounds.height + 2 * padding].join(" ");

    const focusLinks = focusKey ? links.filter(link => link.source === focusKey || link.target === focusKey) : [];
    const focusNeighbors = new Set(focusLinks.flatMap(link => [link.source, link.target]));
    const shownLinks = showAllLinks ? links : focusLinks;

    return (
        <svg
            width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
            onClick={() => onSelect?.(null)}
        >
            <g>
                {shownLinks.map(link => {
                    const source = positionByKey.get(link.source);
                    const target = positionByKey.get(link.target);
                    if (!source || !target) {
                        return null;
                    }
                    return (
                        <line
                            key={`${link.source}|${link.target}`}
                            x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                            stroke={tokens.textMuted} strokeWidth={0.5 + 1.5 * link.similarity}
                            strokeOpacity={focusKey ? 0.7 : 0.25}
                        />
                    );
                })}
            </g>
            {words.map(word => {
                const dimmed = focusKey !== null && word.key !== focusKey && !focusNeighbors.has(word.key);
                const selected = word.key === selectedKey;
                return (
                    <text
                        key={word.key}
                        x={word.x}
                        y={word.y}
                        fontSize={word.fontSize}
                        fontFamily={fontFamily}
                        fontWeight={selected ? 700 : fontWeight}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={colorOf(word.key)}
                        opacity={dimmed ? FOCUS_DIMMED_OPACITY : 1}
                        textDecoration={selected ? "underline" : undefined}
                        onMouseEnter={() => onHover?.(word.key)}
                        onMouseLeave={() => onHover?.(null)}
                        onClick={event => {
                            event.stopPropagation();
                            onSelect?.(word.key);
                        }}
                        style={{ cursor: onSelect ? "pointer" : "default", transition: "opacity 120ms" }}
                    >
                        {word.text}
                    </text>
                );
            })}
        </svg>
    );
}

export default WordCloud;
