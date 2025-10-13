export function greater_than_zero(value:number, fallback:number, callback: (v:number) => void) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
        console.warn(`Value must be a number greater than zero. Defaulting to ${fallback}.`);
        callback(fallback);
    } else {
        callback(value);
    }
}

export function number_between(value:number, min:number, max:number, fallback:number, callback: (v:number) => void) {
    if (typeof value !== 'number' || isNaN(value) || value < min || value > max) {
        console.warn(`Value must be a number between ${min} and ${max}. Defaulting to ${fallback}.`);
        callback(fallback);
    } else {
        callback(value);
    }
}

export function interger_greater(value:number, target:number, fallback:number, callback: (v:number) => void) {
    const _value = Math.round(value);
    if (typeof value !== 'number' || isNaN(value) || _value <= target) {
        console.warn(`Value must be an integer greater than ${target}. Defaulting to ${fallback}.`);
        callback(fallback);
    } else {
        callback(_value);
    }
}

