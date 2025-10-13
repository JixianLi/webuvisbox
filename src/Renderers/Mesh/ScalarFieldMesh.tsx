import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WebGLProgramParametersWithUniforms } from 'three';

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
    let color_logic = '';
    for (let i = 0; i < n; i++) {
        if (i == 0) {
            color_logic += `if (cIndex == ${i})\n{cScalar = aScalar${i};}\n`;
        } else if (i == n - 1) {
            color_logic += `else\n{cScalar = aScalar${i};}\n`;
        } else {
            color_logic += `else if (cIndex == ${i})\n{cScalar = aScalar${i};}\n`;
        }
    }
    let opacity_logic = '';
    for (let i = 0; i < n; i++) {
        if (i == 0) {
            opacity_logic += `if (oIndex == ${i})\n{oScalar = aScalar${i};}\n`;
        } else if (i == n - 1) {
            opacity_logic += `else\n{oScalar = aScalar${i};}\n`;
        } else {
            opacity_logic += `else if (oIndex == ${i})\n{oScalar = aScalar${i};}\n`;
        }
    }
    return color_logic + opacity_logic;
};

export const ScalarFieldPhongMaterial = (props) => {
    const material = new THREE.MeshPhongMaterial({
        color: props.color || '#ffffff',
        specular: props.specular || '#ffffff',
        shininess: props.shininess || 30,
        transparent: props.transparent !== undefined ? props.transparent : true,
        depthTest: props.depthTest !== undefined ? props.depthTest : true,
        depthWrite: props.depthWrite !== undefined ? props.depthWrite : true,
        side: props.side !== undefined ? props.side : THREE.DoubleSide,
        // Other properties can be added as needed
    });


    material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
        // 1. Pass our LUT texture as a uniform
        shader.uniforms.uLutTexture = { value: null };
        shader.uniforms.cIndex = { value: 0 };
        shader.uniforms.oIndex = { value: 0 };

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

        material.userData.shader = shader;
    };

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

    const materialProps = {
        scalarCount: scalars.length,
        color,
        specular,
        shininess,
        transparent,
        depthTest,
        depthWrite,
        side
    };

    const material = useMemo(() => ScalarFieldPhongMaterial(materialProps), [materialProps]);

    useFrame(() => {
        if (material.userData.shader) {
            material.userData.shader.uniforms.uLutTexture.value = texture;
            material.userData.shader.uniforms.cIndex.value = cIndex;
            material.userData.shader.uniforms.oIndex.value = oIndex;
        }
        // console.log(material.userData.shader);
    });

    // Create geometry with memoization for performance
    const geometry = useMemo(() => {
        const geom = ScalarFieldBufferedGeometry({ vertices, indices, scalars, normals });
        return geom;
    }, [vertices, indices, normals, scalars]);

    // Clean up geometry on unmount
    useEffect(() => {
        return () => {
            geometry?.dispose();
            material?.dispose();
        };
    }, [geometry]);

    return (
        <mesh ref={meshRef} geometry={geometry} material={material}>
        </mesh>
    );
};

export default ScalarFieldMesh;