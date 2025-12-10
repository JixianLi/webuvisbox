// ABOUTME: Utility to save WebGL canvas as 8-bit grayscale PNG with alpha.
// ABOUTME: Uses 2D canvas to create grayscale image from WebGL pixel data.

import * as THREE from "three";

export function saveGrayscalePng(gl: THREE.WebGLRenderer, filename: string): void {
    const canvas = gl.domElement;
    const width = canvas.width;
    const height = canvas.height;

    // Read pixels from WebGL
    const glContext = gl.getContext();
    const pixels = new Uint8Array(width * height * 4);
    glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels);

    // Create a 2D canvas for output
    const canvas2d = document.createElement("canvas");
    canvas2d.width = width;
    canvas2d.height = height;
    const ctx = canvas2d.getContext("2d")!;

    // Create ImageData and fill with grayscale (R=G=B=depth, A=alpha)
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        // WebGL reads from bottom-left, flip vertically
        const srcY = height - 1 - y;
        for (let x = 0; x < width; x++) {
            const srcIdx = (srcY * width + x) * 4;
            const dstIdx = (y * width + x) * 4;
            const gray = pixels[srcIdx]; // R channel as grayscale
            const alpha = pixels[srcIdx + 3];
            data[dstIdx] = gray;     // R
            data[dstIdx + 1] = gray; // G
            data[dstIdx + 2] = gray; // B
            data[dstIdx + 3] = alpha; // A
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Save as PNG
    const dataURL = canvas2d.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataURL;
    link.click();
}
