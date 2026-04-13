import { linspace, rescale, clamp } from "@/Helpers/MathHelper"

export function randomGen(bounds: [number, number, number, number, number, number], num: number) {
    const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;

    const points = [];
    for (let i = 0; i < num; i++) {
        const x = rescale(Math.random(), xMin, xMax);
        const y = rescale(Math.random(), yMin, yMax);
        const z = rescale(Math.random(), zMin, zMax);
        points.push([x, y, z]);
    }
    return points;
}

export function uniformGen(bounds: [number, number, number, number, number, number], numX: number, numY: number, numZ: number) {
    const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;

    const xRange = linspace(xMin, xMax, numX);
    const yRange = linspace(yMin, yMax, numY);
    const zRange = linspace(zMin, zMax, numZ);

    const points = [];
    zRange.forEach(z => {
        yRange.forEach(y => {
            xRange.forEach(x => {
                points.push([x, y, z]);
            });
        });
    });
    return points;
}

export function manualGen(bounds: [number, number, number, number, number, number], x, y, z) {
    const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;
    let [xv, yv, zv] = [x, y, z];
    xv = clamp(xv, xMin, xMax);
    yv = clamp(yv, yMin, yMax);
    zv = clamp(zv, zMin, zMax);
    return [[xv, yv, zv]];
}
