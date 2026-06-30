// ABOUTME: Parameterized SVG <marker> arrowhead for the Trace sequence diagram.
// ABOUTME: A solid, round-cornered triangle sized in user-space px (head does not scale with the line's stroke).

export type TraceMarkerProps = {
    id: string;
    length: number;
    width: number;
    color: string;
    cornerRadius?: number;
};

export function TraceMarker({ id, length, width, color, cornerRadius }: TraceMarkerProps) {
    const mid = width / 2;
    const radius = cornerRadius ?? Math.max(width / 6, 1);

    return (
        <marker
            id={id}
            viewBox={`0 0 ${length} ${width}`}
            refX={length}
            refY={mid}
            markerWidth={length}
            markerHeight={width}
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
            overflow="visible"
        >
            <path
                d={`M 0 0 L ${length} ${mid} L 0 ${width} z`}
                fill={color}
                stroke={color}
                strokeWidth={radius * 2}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </marker>
    );
}

export default TraceMarker;
