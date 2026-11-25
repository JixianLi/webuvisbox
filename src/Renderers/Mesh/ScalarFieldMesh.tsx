import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WebGLProgramParametersWithUniforms } from 'three';
import { onTextureUpdate } from '../Colormaps/TextureUpdates';

interface ScalarFieldBufferedGeometryProps {
    vertices: Float32Array;        // Vertex positions [x,y,z,x,y,z,...]
    indices: Uint32Array;          // Triangle indices referencing vertices
    scalars: Float32Array[];         // scalar values for color lut [s,s,s,s,...] same length as vertices/3
    normals?: Float32Array;        // Optional normals [nx,ny,nz,nx,ny,nz,...]
}
export const ScalarFieldBufferedGeometry = (props: ScalarFieldBufferedGeometryProps) => {
    const {
        vertices,
        indices,
        scalars,
        normals,
    } = props;
    const geometry = new THREE.BufferGeometry();

    // Set vertex positions (required)
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    //  Add the scalar attribute for color mapping
    scalars.forEach((scalarArray, index) => {
        geometry.setAttribute(`aScalar${index}`, new THREE.BufferAttribute(scalarArray, 1));
    });

    // Set indices for triangle faces
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Set normals or compute them automatically
    if (normals && normals.length === vertices.length) {
        // Use provided normals
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
        // Compute normals automatically for proper lighting
        geometry.computeVertexNormals();
    }

    // Compute bounding sphere for frustum culling
    geometry.computeBoundingSphere();

    return geometry;

};

const getAttributeLoaderLogic = (n: number): string => {
    let colorLogic = '';
    for (let i = 0; i < n; i++) {
        if (i == 0) {
            colorLogic += `if (cIndex == ${i})\n{cScalar = aScalar${i};}\n`;
        } else if (i == n - 1) {
            colorLogic += `else\n{cScalar = aScalar${i};}\n`;
        } else {
            colorLogic += `else if (cIndex == ${i})\n{cScalar = aScalar${i};}\n`;
        }
    }
    let opacityLogic = '';
    for (let i = 0; i < n; i++) {
        if (i == 0) {
            opacityLogic += `if (oIndex == ${i})\n{oScalar = aScalar${i};}\n`;
        } else if (i == n - 1) {
            opacityLogic += `else\n{oScalar = aScalar${i};}\n`;
        } else {
            opacityLogic += `else if (oIndex == ${i})\n{oScalar = aScalar${i};}\n`;
        }
    }
    return colorLogic + opacityLogic;
};

// The material depends only on scalarCount (its shader declares that many attributes); everything else is synced onto it
// by ScalarFieldMesh. Its uniforms exist before the shader compiles and are shared with it, so setting
// material.userData.uniforms.*.value updates the compiled shader directly.
export const ScalarFieldPhongMaterial = (props) => {
    const uniforms = { uLutTexture: { value: null }, cIndex: { value: 0 }, oIndex: { value: 0 } };
    const material = new THREE.MeshPhongMaterial({
        color: props.color ?? '#ffffff',
        specular: props.specular ?? '#ffffff',
        shininess: props.shininess ?? 30,
        transparent: props.transparent !== undefined ? props.transparent : true,
        depthTest: props.depthTest !== undefined ? props.depthTest : true,
        depthWrite: props.depthWrite !== undefined ? props.depthWrite : true,
        side: props.side !== undefined ? props.side : THREE.DoubleSide,
        // Other properties can be added as needed
    });


    material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
        // 1. Pass our LUT texture as a uniform
        shader.uniforms.uLutTexture = uniforms.uLutTexture;
        shader.uniforms.cIndex = uniforms.cIndex;
        shader.uniforms.oIndex = uniforms.oIndex;

        let scalarAttributes = '';
        for (let i = 0; i < props.scalarCount; i++) {
            scalarAttributes += `attribute float aScalar${i};\n`;
        }

        // 2. Add the necessary declarations to the shaders
        shader.vertexShader = `
            ${scalarAttributes}
            uniform int cIndex;
            uniform int oIndex;
            varying float cScalar;
            varying float oScalar;
            ${shader.vertexShader}
        `;

        shader.fragmentShader = `
            uniform sampler2D uLutTexture;
            varying float cScalar;
            varying float oScalar;
            ${shader.fragmentShader}
        `;

        // 3. In the vertex shader, pass the attribute to the fragment shader
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            ${getAttributeLoaderLogic(props.scalarCount)}
            `
        );

        // 4. In the fragment shader, look up the color and override diffuse/opacity
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
                #include <color_fragment>
                // Use the varying scalar to look up the color in our LUT
                vec4 lutColor = texture2D(uLutTexture, vec2(cScalar, 0.5));
                vec4 lutOpacity = texture2D(uLutTexture, vec2(oScalar, 0.5));

                // Override the material's diffuse color and opacity
                diffuseColor = vec4(lutColor.rgb, lutOpacity.a);
            `
        );
    };
    // three.js reuses a compiled program for materials whose onBeforeCompile source matches, which every
    // ScalarFieldPhongMaterial shares; key it by scalarCount so meshes with different attribute counts never share one.
    material.customProgramCacheKey = () => `scalar-field-phong-${props.scalarCount}`;
    material.userData.uniforms = uniforms;

    return material;
};


export interface ScalarFieldMeshProps {
    vertices: Float32Array;        // Vertex positions [x,y,z,x,y,z,...]
    indices: Uint32Array;          // Triangle indices referencing vertices
    scalars: Float32Array[];       // scalar values for color lut [s,s,s,s,...] same length as vertices/3
    cIndex: number;                // Index of the active scalar field
    oIndex: number;                // Index of the active scalar field for opacity
    texture: THREE.Texture;        // Texture to apply to the mesh
    normals?: Float32Array;        // Optional normals [nx,ny,nz,nx,ny,nz,...]
    color?: string;                // Base material color
    specular?: string;             // Specular highlight color
    shininess?: number;            // Material shininess factor
    opacity?: number;              // Material opacity (0-1)
    transparent?: boolean;         // Enable transparency
    depthTest?: boolean;           // Enable depth testing
    depthWrite?: boolean;          // Enable depth writing
    side?: THREE.Side;             // Which sides to render
}


export const ScalarFieldMesh = (props: ScalarFieldMeshProps) => {
    const {
        vertices,
        indices,
        scalars,
        cIndex,
        oIndex,
        normals,
        texture,
        color = '#ffffff',
        specular = '#ffffff',
        shininess = 30,
        transparent = true,
        depthTest = true,
        depthWrite = true,
        side = THREE.DoubleSide
    } = props;

    const meshRef = useRef<THREE.Mesh>(null);

    const invalidate = useThree(state => state.invalidate);
    const scalarCount = scalars.length;

    // One material per scalar count, kept across renders (rebuilding it every render recompiled the shader and leaked the
    // old material). Prop and uniform changes are synced onto it below, so transfer-function edits still show.
    const material = useMemo(() => ScalarFieldPhongMaterial({ scalarCount }), [scalarCount]);
    useEffect(() => () => material.dispose(), [material]);

    useLayoutEffect(() => {
        material.color.set(color);
        material.specular.set(specular);
        material.shininess = shininess;
        material.transparent = transparent;
        material.depthTest = depthTest;
        material.depthWrite = depthWrite;
        material.side = side;
        // side changes the compiled program (double-sided lighting), so the material is recompiled when needed.
        material.needsUpdate = true;
        invalidate();
    }, [material, color, specular, shininess, transparent, depthTest, depthWrite, side, invalidate]);

    // The texture object stays the same while a transfer function is edited: TextureManager rewrites its data and sets
    // needsUpdate, which three.js uploads on the next frame, and announces it so a canvas drawing on demand redraws.
    // A new texture (another colormap) or index is set here.
    useLayoutEffect(() => {
        const uniforms = material.userData.uniforms;
        uniforms.uLutTexture.value = texture;
        uniforms.cIndex.value = cIndex;
        uniforms.oIndex.value = oIndex;
        invalidate();
    }, [material, texture, cIndex, oIndex, invalidate]);
    useEffect(() => onTextureUpdate(texture, invalidate), [texture, invalidate]);

    // Create geometry with memoization for performance
    const geometry = useMemo(() => {
        const geom = ScalarFieldBufferedGeometry({ vertices, indices, scalars, normals });
        return geom;
    }, [vertices, indices, normals, scalars]);

    // Clean up geometry on unmount
    useEffect(() => {
        return () => {
            geometry?.dispose();
        };
    }, [geometry]);

    return (
        <mesh ref={meshRef} geometry={geometry} material={material}>
        </mesh>
    );
};

export default ScalarFieldMesh;