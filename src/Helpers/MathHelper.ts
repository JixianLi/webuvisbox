/**
 * Creates an array of evenly spaced numbers between start and end (inclusive).
 * @param start - The starting value of the sequence
 * @param end - The ending value of the sequence
 * @param num - The number of elements in the sequence
 * @returns An array of evenly spaced numbers
 */
export function linspace(start: number, end: number, num: number): number[] {
    if (num <= 0) return [];
    if (num === 1) return [(start + end) / 2]; // Single value case: return the midpoint
    
    return Array.from({ length: num }, (_, i) => start + (end - start) * i / (num - 1));
}

/**
 * Creates an array of sequential numbers with customizable start, end, and step values.
 * @param start - The starting value of the sequence (default: 0)
 * @param end - The ending value of the sequence (exclusive)
 * @param step - The step between values (default: 1)
 * @returns An array containing the sequence [start, start+step, start+2*step, ..., < end]
 */
export function range(start: number = 0, end?: number, step: number = 1): number[] {
    // Handle the case where only one argument is provided (backwards compatibility)
    if (end === undefined) {
        end = start;
        start = 0;
    }
    
    // Calculate the number of elements
    const count = Math.max(0, Math.ceil((end - start) / step));
    
    return Array.from({ length: count }, (_, i) => start + i * step);
}

/**
 * Rescales a value from one range to another, with optional clamping.
 * @param value - The value to rescale
 * @param target_min - The minimum of the target range
 * @param target_max - The maximum of the target range
 * @param source_min - The minimum of the source range (default: 0)
 * @param source_max - The maximum of the source range (default: 1)
 * @returns The rescaled value, clamped to the target range
 */
export function rescale(value: number, target_min: number, target_max: number, source_min: number = 0, source_max: number = 1): number {
    if (source_min === source_max) return (target_min + target_max) / 2; // Handle zero-width source range
    if (target_min === target_max) return target_min; // Handle zero-width target range
    
    const ratio = (value - source_min) / (source_max - source_min);
    return clamp(target_min + ratio * (target_max - target_min), target_min, target_max);
}

/**
 * Constrains a value to lie between a minimum and maximum value.
 * @param value - The value to constrain
 * @param min - The lower bound
 * @param max - The upper bound
 * @returns The clamped value: min if value < min, max if value > max, value otherwise
 */
export function clamp(value: number, min?: number, max?: number): number {
    if (min !== undefined && value < min) value = min;
    if (max !== undefined && value > max) value = max;
    return value;
}

export const clip = clamp;

/**
 * Converts a number of seconds into a formatted string based on the provided format.
 *
 * Format placeholders:
 * - `DD` or `D` - Days (DD for zero-padded, D for no padding)
 * - `HH` or `H` - Hours (HH for zero-padded, H for no padding)  
 * - `MM` or `M` - Minutes (MM for zero-padded, M for no padding)
 * - `SS` or `S` - Seconds (SS for zero-padded, S for no padding)
 *
 * Logic: If a larger unit is not specified in the format, the next largest unit 
 * will show the total amount. For example:
 * - If days are not in format, hours will show total hours (including >24)
 * - If days and hours are not in format, minutes will show total minutes
 * - If only seconds are in format, seconds will show total seconds
 *
 * @param seconds - The total number of seconds to convert.
 * @param format - Format string with placeholders (e.g., "DD:HH:MM:SS", "H:MM:SS", "M:SS")
 * @returns A string formatted according to the format parameter.
 *
 * @example
 * ```typescript
 * TimeInSecondsToString(90061, "DD:HH:MM:SS"); // Returns "01:01:01:01"
 * TimeInSecondsToString(90061, "H:MM:SS");     // Returns "25:01:01" (total hours)
 * TimeInSecondsToString(90061, "M:SS");        // Returns "1501:01" (total minutes)
 * TimeInSecondsToString(90061, "S");           // Returns "90061" (total seconds)
 * TimeInSecondsToString(3661, "MM:SS");        // Returns "61:01" (total minutes)
 * ```
 */
export function timeInSecondsToString(seconds: number, format: string): string {
    // Check which units are present in the format
    const hasDays = /DD?/g.test(format);
    const hasHours = /HH?/g.test(format);
    const hasMinutes = /MM?/g.test(format);
    const hasSeconds = /SS?/g.test(format);
    
    let days, hrs, mins, secs;
    
    // Determine which units should show fractional values (only when it's the ONLY unit)
    const fracDays = hasDays && !(hasHours || hasMinutes || hasSeconds);
    const fracHrs = hasHours && !(hasMinutes || hasSeconds);
    const fracMins = hasMinutes && !hasSeconds;
    const fracSecs = hasSeconds && !(hasDays || hasHours || hasMinutes);
    
    // Calculate values based on which units are present
    if (hasDays) {
        days = Math.floor(seconds / 86400);
        const remainingAfterDays = seconds % 86400;
        
        if (hasHours) {
            // Standard breakdown: days, hours, minutes, seconds
            hrs = Math.floor(remainingAfterDays / 3600);
            const remainingAfterHours = remainingAfterDays % 3600;
            
            if (hasMinutes) {
                mins = Math.floor(remainingAfterHours / 60);
                secs = Math.floor(remainingAfterHours % 60);
            } else if (hasSeconds) {
                // Days, hours, and seconds only (no minutes)
                mins = 0;
                secs = Math.floor(remainingAfterHours);
            } else {
                mins = Math.floor(remainingAfterHours / 60);
                secs = Math.floor(remainingAfterHours % 60);
            }
        } else if (hasMinutes) {
            // Days and minutes only: minutes can be 0-1439
            hrs = 0;
            mins = Math.floor(remainingAfterDays / 60);
            secs = hasSeconds ? Math.floor(remainingAfterDays % 60) : Math.floor(remainingAfterDays % 60);
        } else if (hasSeconds) {
            // Days and seconds only: seconds can be 0-86399
            hrs = 0;
            mins = 0;
            secs = Math.floor(remainingAfterDays);
        } else if (fracDays) {
            // Only days - show fractional days
            days = seconds / 86400;
            hrs = mins = secs = 0;
        } else {
            // Only days (integer)
            hrs = mins = secs = 0;
        }
    } else if (hasHours) {
        days = 0;
        if (fracHrs) {
            // Only hours - show fractional hours
            hrs = seconds / 3600;
            mins = secs = 0;
        } else {
            // Hours with other units - show total hours
            hrs = Math.floor(seconds / 3600);
            const remainingAfterHours = seconds % 3600;
            
            if (hasMinutes) {
                mins = Math.floor(remainingAfterHours / 60);
                secs = hasSeconds ? Math.floor(remainingAfterHours % 60) : Math.floor(remainingAfterHours % 60);
            } else if (hasSeconds) {
                // Hours and seconds only (no minutes)
                mins = 0;
                secs = Math.floor(remainingAfterHours);
            } else {
                mins = Math.floor(remainingAfterHours / 60);
                secs = Math.floor(remainingAfterHours % 60);
            }
        }
    } else if (hasMinutes) {
        days = hrs = 0;
        if (fracMins) {
            // Only minutes - show fractional minutes
            mins = seconds / 60;
            secs = 0;
        } else {
            // Minutes with seconds - show total minutes
            mins = Math.floor(seconds / 60);
            secs = Math.floor(seconds % 60);
        }
    } else if (hasSeconds) {
        // Only seconds - show total seconds
        days = hrs = mins = 0;
        secs = seconds;
    } else {
        // No valid format found
        return seconds.toString();
    }
    
    // Helper function to format numbers (handle fractional values)
    const formatNumber = (value: number, padded: boolean, fractional: boolean): string => {
        if (fractional && value % 1 !== 0) {
            // For fractional values, format with 2 decimal places
            const formatted = value.toFixed(2);
            return padded && value < 10 ? formatted.padStart(5, '0') : formatted;
        } else {
            // For integer values, use standard formatting
            const intValue = Math.floor(value);
            return padded ? intValue.toString().padStart(2, '0') : intValue.toString();
        }
    };
    
    return format
        .replace(/DD/g, formatNumber(days, true, fracDays))
        .replace(/D/g, formatNumber(days, false, fracDays))
        .replace(/HH/g, formatNumber(hrs, true, fracHrs))
        .replace(/H/g, formatNumber(hrs, false, fracHrs))
        .replace(/MM/g, formatNumber(mins, true, fracMins))
        .replace(/M/g, formatNumber(mins, false, fracMins))
        .replace(/SS/g, formatNumber(secs, true, fracSecs))
        .replace(/S/g, formatNumber(secs, false, fracSecs));
}

/**
 * Finds the index of the largest element in a sorted array that is smaller than or equal to the given value.
 *
 * The function assumes the input array is sorted in ascending order.
 * If the value is smaller than the smallest element, returns 0.
 * If the value is greater than or equal to the largest element, returns the last index.
 * Otherwise, performs a binary search to efficiently find the correct index.
 *
 * @param array - A sorted array of numbers (ascending order).
 * @param value - The value to compare against elements in the array.
 * @returns The index of the largest element smaller than or equal to `value`, or 0 if no such element exists.
 *
 * @example
 * ```typescript
 * findSmallerIndex([1, 3, 5, 7], 4); // returns 1 (index of 3)
 * findSmallerIndex([1, 3, 5, 7], 7); // returns 3 (index of 7)
 * findSmallerIndex([1, 3, 5, 7], 0); // returns 0
 * ```
 */
export function findSmallerIndex(array: number[], value: number): number {
    let low = 0;
    let high = array.length - 1;

    if (value < array[0]) return 0; // Value is smaller than the smallest element, return 0
    if (value >= array[high]) return high; // Value is larger than or equal to the largest element

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (array[mid] === value) {
            return mid; // Exact match found
        } else if (array[mid] < value) {
            low = mid + 1; // Search in the upper half
        } else {
            high = mid - 1; // Search in the lower half
        }
    }
    return high; // 'high' is the index of the largest element smaller than 'value'
}

export function euclideanDistance2D(pointA: [number, number], pointB: [number, number]): number {
    const dx = pointA[0] - pointB[0];
    const dy = pointA[1] - pointB[1];
    return Math.sqrt(dx * dx + dy * dy);
}

export function degree2radian(degree: number): number {
    return degree * (Math.PI / 180);
}

export function radian2degree(radian: number): number {
    return radian * (180 / Math.PI);
}