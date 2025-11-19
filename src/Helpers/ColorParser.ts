import * as d3 from "d3";

export function parseColor(color: string | d3.RGBColor | [number, number, number, number] | [number, number, number]): d3.RGBColor {
    let rgbColor: d3.RGBColor;
    if (typeof color === 'string') {
        rgbColor = d3.rgb(color);
    } else if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
        rgbColor = color as d3.RGBColor;
    } else if (Array.isArray(color)) {
        if (color.length === 3) {
            rgbColor = d3.rgb(color[0], color[1], color[2]);
        } else if (color.length === 4) {
            // For RGBA, ignore alpha channel as d3.RGBColor doesn't support it directly
            rgbColor = d3.rgb(color[0], color[1], color[2]);
        } else {
            throw new Error('Color array must have 3 or 4 elements');
        }
    } else {
        throw new Error('Invalid color format');
    }
    return rgbColor;
}

export function color_equals(c1: d3.RGBColor, c2: d3.RGBColor): boolean {
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
}