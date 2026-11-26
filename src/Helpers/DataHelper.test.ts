import { describe, expect, it } from 'vitest';
import { decode64, encode64 } from './DataHelper';
import FIXTURE from './DataHelper.fixture.json';

// The fixture comes from scripts/make_decode64_fixture.py: Python's struct + base64, as a data server encodes arrays.
describe('decode64', () => {
    it.each(Object.entries(FIXTURE))('decodes %s arrays encoded by Python', (dataType, { base64, values }) => {
        const decoded = decode64(base64, dataType as Parameters<typeof decode64>[1]);
        expect(Array.from(decoded)).toEqual(values);
    });

    it('round-trips with encode64', () => {
        const array = new Float32Array([1, -2.5, 1e-8, 42]);
        expect(decode64(encode64(array), 'float32')).toEqual(array);
    });

    it('encodes a view of a larger buffer as only its own bytes', () => {
        const buffer = new Float32Array([9, 1, 2, 9]);
        expect(Array.from(decode64(encode64(buffer.subarray(1, 3)), 'float32'))).toEqual([1, 2]);
    });
});
