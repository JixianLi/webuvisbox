import { makeObservable, observable, runInAction } from 'mobx';
import { findSmallerIndex } from '@/Helpers/MathHelper';

export class OpacityMap {
    /** Control points for opacity interpolation */
    opacityControlPoints: number[];

    /** Opacity values at the control points */
    opacityValues: number[];

    constructor(controlPoints: number[] = [0, 1], values: number[] = [1, 1]) {
        this.opacityControlPoints = controlPoints;
        this.opacityValues = values;

        makeObservable(this, {
            opacityControlPoints: observable,
            opacityValues: observable,
        });
    }

    removeOpacityControlPoint(index: number) {
        if (index <= 0 || index >= this.opacityControlPoints.length - 1) {
            console.warn("Cannot remove first or last opacity control point.");
            return;
        }
        runInAction(() => {
            this.opacityControlPoints.splice(index, 1);
            this.opacityValues.splice(index, 1);
        });
    }

    addOpacityControlPoint(value:number, opacity?:number) {
        if (value <= this.opacityControlPoints[0] || value >= this.opacityControlPoints[this.opacityControlPoints.length - 1]) {
            console.warn("New opacity control point must be within the existing range.");
            return;
        }
        let idx = findSmallerIndex(this.opacityControlPoints, value) + 1;
        if (idx === this.opacityControlPoints.length) {
            idx = this.opacityControlPoints.length - 1;
        }
        const newOpacity = opacity !== undefined ? opacity : this.getOpacityFromControlPoints(value);
        runInAction(() => {
            this.opacityControlPoints.splice(idx, 0, value);
            this.opacityValues.splice(idx, 0, newOpacity);
        });
    }

    getOpacityFromControlPoints(value: number): number {
        // Clamp value to [0,1] range
        value = Math.max(0, Math.min(value, 1));

        const controlPoints = this.opacityControlPoints;
        const values = this.opacityValues;

        if (controlPoints.length === 0) {
            return 1.0;
        }

        // Find the control points that bracket our value
        let leftIndex = 0;
        while (leftIndex < controlPoints.length - 1 && controlPoints[leftIndex + 1] <= value) {
            leftIndex++;
        }
        const rightIndex = Math.min(leftIndex + 1, controlPoints.length - 1);

        if (leftIndex === rightIndex) {
            return values[leftIndex];
        }

        // Calculate interpolation ratio between control points
        const ratio = (value - controlPoints[leftIndex]) / (controlPoints[rightIndex] - controlPoints[leftIndex]);

        // Interpolate between opacities
        return values[leftIndex] + ratio * (values[rightIndex] - values[leftIndex]);
    }

        toObject(): any {
        return {
            opacity_control_points: [...this.opacityControlPoints],
            opacity_values: [...this.opacityValues]
        };
    }

    static fromObject(obj: any): OpacityMap {
        const controlPoints = obj.opacity_control_points ? [...obj.opacity_control_points] : [0, 1];
        const values = obj.opacity_values ? [...obj.opacity_values] : [1, 1];
        return new OpacityMap(controlPoints, values);
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