import { linspace, rescale, clamp } from "@/Helpers/MathHelper"

export function random_gen(bounds: [number, number, number, number, number, number], num: number) {
    const [x_min, x_max, y_min, y_max, z_min, z_max] = bounds;

    const points = [];
    for (let i = 0; i < num; i++) {
        const x = rescale(Math.random(), x_min, x_max);
        const y = rescale(Math.random(), y_min, y_max);
        const z = rescale(Math.random(), z_min, z_max);
        points.push([x, y, z]);
    }
    return points;
}

export function uniform_gen(bounds: [number, number, number, number, number, number], num_x: number, num_y: number, num_z: number) {
    const [x_min, x_max, y_min, y_max, z_min, z_max] = bounds;

    const x_range = linspace(x_min, x_max, num_x);
    const y_range = linspace(y_min, y_max, num_y);
    const z_range = linspace(z_min, z_max, num_z);

    const points = [];
    z_range.forEach(z => {
        y_range.forEach(y => {
            x_range.forEach(x => {
                points.push([x, y, z]);
            });
        });
    });
    return points;
}

export function manual_gen(bounds: [number, number, number, number, number, number], x, y, z) {
    const [x_min, x_max, y_min, y_max, z_min, z_max] = bounds;
    let [xv, yv, zv] = [x, y, z];
    xv = clamp(xv, x_min, x_max);
    yv = clamp(yv, y_min, y_max);
    zv = clamp(zv, z_min, z_max);
    return [[xv, yv, zv]];
}