// ABOUTME: A slider that applies its value on release, for values that are expensive to apply (regenerating data,
// ABOUTME: rebuilding geometry): applied on every step, they would stall the drag. Its label follows the drag.

import { useState } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

interface SliderOnReleaseProps {
    value: number;
    min: number;
    max: number;
    step: number;
    label: (value: number) => string;
    onRelease: (value: number) => void;
}

export function SliderOnRelease({ value, min, max, step, label, onRelease }: SliderOnReleaseProps) {
    const [dragValue, setDragValue] = useState<number | null>(null);
    const shown = dragValue ?? value;
    return (
        <Box>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>{label(shown)}</Typography>
            <Slider size="small" min={min} max={max} step={step} value={shown}
                    onChange={(_, next) => setDragValue(next as number)}
                    onChangeCommitted={(_, next) => { setDragValue(null); onRelease(next as number); }} />
        </Box>
    );
}

export default SliderOnRelease;
