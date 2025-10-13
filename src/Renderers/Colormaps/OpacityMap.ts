import { makeObservable, observable, runInAction } from 'mobx';
import { findSmallerIndex } from '@/Helpers/MathHelper';

export class OpacityMap {
    /** Control points for opacity interpolation */
    opacity_control_points: number[];

    /** Opacity values at the control points */
    opacity_values: number[];

    constructor(control_points: number[] = [0, 1], values: number[] = [1, 1]) {
        this.opacity_control_points = control_points;
        this.opacity_values = values;

        makeObservable(this, {
            opacity_control_points: observable,
            opacity_values: observable,
        });
    }

    removeOpacityControlPoint(index: number) {
        if (index <= 0 || index >= this.opacity_control_points.length - 1) {
            console.warn("Cannot remove first or last opacity control point.");
            return;
        }
        runInAction(() => {
            this.opacity_control_points.splice(index, 1);
            this.opacity_values.splice(index, 1);
        });
    }

    addOpacityControlPoint(value:number, opacity?:number) {
        if (value <= this.opacity_control_points[0] || value >= this.opacity_control_points[this.opacity_control_points.length - 1]) {
            console.warn("New opacity control point must be within the existing range.");
            return;
        }
        let idx = findSmallerIndex(this.opacity_control_points, value) + 1;
        if (idx === this.opacity_control_points.length) {
            idx = this.opacity_control_points.length - 1;
        }
        const newOpacity = opacity !== undefined ? opacity : this.getOpacityFromControlPoints(value);
        runInAction(() => {
            this.opacity_control_points.splice(idx, 0, value);
            this.opacity_values.splice(idx, 0, newOpacity);
        });
    }

    getOpacityFromControlPoints(value: number): number {
        // Clamp value to [0,1] range
        value = Math.max(0, Math.min(value, 1));

        const opacity_control_points = this.opacity_control_points;
        const opacity_values = this.opacity_values;

        if (opacity_control_points.length === 0) {
            return 1.0;
        }

        // Find the control points that bracket our value
        let leftIndex = 0;
        while (leftIndex < opacity_control_points.length - 1 && opacity_control_points[leftIndex + 1] <= value) {
            leftIndex++;
        }
        const rightIndex = Math.min(leftIndex + 1, opacity_control_points.length - 1);

        if (leftIndex === rightIndex) {
            return opacity_values[leftIndex];
        }

        // Calculate interpolation ratio between control points
        const ratio = (value - opacity_control_points[leftIndex]) / (opacity_control_points[rightIndex] - opacity_control_points[leftIndex]);

        // Interpolate between opacities
        return opacity_values[leftIndex] + ratio * (opacity_values[rightIndex] - opacity_values[leftIndex]);
    }

        toObject(): any {
        return {
            opacity_control_points: [...this.opacity_control_points],
            opacity_values: [...this.opacity_values]
        };
    }

    static fromObject(obj: any): OpacityMap {
        const opacity_control_points = obj.opacity_control_points ? [...obj.opacity_control_points] : [0, 1];
        const opacity_values = obj.opacity_values ? [...obj.opacity_values] : [1, 1];
        return new OpacityMap(opacity_control_points, opacity_values);
    }

    toJson(): string {
        return JSON.stringify(this.toObject(), null, 2);
    }

    static fromJson(json: string): OpacityMap {
        try {
            const obj = JSON.parse(json);
            return OpacityMap.fromObject(obj);
        } catch (error) {
            console.error("Failed to parse OpacityMap JSON:", error);
            throw error;
        }
    }
}

export default OpacityMap;