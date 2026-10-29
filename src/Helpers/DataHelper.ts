const BASE64_CHUNK_BYTES = 0x8000;

type DataType = "float32" | "float64" | "int32" | "int16" | "int8" | "uint32" | "uint16" | "uint8";

type TypedArray = Float32Array | Float64Array | Int32Array | Int16Array | Int8Array | Uint32Array | Uint16Array | Uint8Array;

/**
 * Decodes a base64 string into a typed array of the specified data type.
 * @param str - The base64 encoded string.
 * @param dataType - The desired data type of the output array. Defaults to "float32".
 * @returns A typed array corresponding to the decoded data.
 * @throws Will throw an error if the specified data type is unsupported.
 */

export const decode64 = (str: string, dataType: DataType = "float32"): TypedArray => {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }
    const buffer = bytes.buffer;

    switch (dataType) {
        case "float32":
            return new Float32Array(buffer);
        case "float64":
            return new Float64Array(buffer);
        case "int32":
            return new Int32Array(buffer);
        case "int16":
            return new Int16Array(buffer);
        case "int8":
            return new Int8Array(buffer);
        case "uint32":
            return new Uint32Array(buffer);
        case "uint16":
            return new Uint16Array(buffer);
        case "uint8":
            return new Uint8Array(buffer);
        default:
            throw new Error(`Unsupported data type: ${dataType}`);
    }
}

/**
 * Encodes a typed array into a base64 string.
 * @param array - The typed array to encode.
 * @returns A base64 encoded string representing the array data.
 */
export const encode64 = (array: TypedArray): string => {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    let binary = '';
    // In chunks: String.fromCharCode takes its bytes as arguments, and engines cap the argument count.
    for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_BYTES) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK_BYTES));
    }
    return btoa(binary);
}