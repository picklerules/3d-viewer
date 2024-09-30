import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import * as THREE from 'three';
import { calculateMeshProperties } from './MeshProperties';

const textureLoader = new THREE.TextureLoader();

/**
 * FileLoader
 * Returns the appropriate 3D model loader based on the file extension.
 * Supports GLTF, OBJ, FBX, STL, PLY, VRML, and other common 3D formats.
 *
 * @param {string} extension - The file extension (e.g., 'gltf', 'obj', 'fbx', etc.).
 * @returns {Object} Loader object based on the file format or null if not supported.
 */
export function FileLoader(extension) {
    switch (extension) {
        case 'gltf':
        case 'glb':
            return new GLTFLoader();
        case 'obj':
            return new OBJLoader();
        case 'fbx':
            return new FBXLoader();
        case 'stl':
            return new STLLoader();
        case 'ply':
            return new PLYLoader();
        case 'wrl':
        case 'vrml':
            return new VRMLLoader();
        default:
            return null;
    }
}

/**
 * handleOBJ
 * Loads and renders an OBJ file format into the Three.js scene.
 *
 * @param {Object} scene - The Three.js scene to which the object is added.
 * @param {string} url - The file URL or path.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.js camera.
 * @param {Object} controls - OrbitControls object for model interaction.
 * @param {Function} setErrorMessage - Function to set an error message.
 * @param {Function} setDetails - Function to update the model's details (vertices, triangles, etc.).
 */
export function handleOBJ(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new OBJLoader();
    loader.load(url, obj => {
        console.log('OBJ Loaded:', obj);
        obj.traverse(child => {
            if (child.isMesh && child.material) {
                applyMaterialColor(child.material);
            }
        });
        scene.add(obj);
        updateScene(obj, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        console.error('An error occurred while loading the OBJ file:', err);
        setErrorMessage("An error occurred while loading the OBJ file.");
    });
}

/**
 * handlePLY
 * Loads and renders a PLY file format into the Three.js scene.
 *
 * @param {Object} scene - The Three.js scene to which the geometry is added.
 * @param {string} url - The file URL or path.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.js camera.
 * @param {Object} controls - OrbitControls object for model interaction.
 * @param {Function} setErrorMessage - Function to set an error message.
 * @param {Function} setDetails - Function to update the model's details (vertices, triangles, etc.).
 */
export function handlePLY(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new PLYLoader();
    loader.load(url, geometry => {
        console.log('PLY Loaded:', geometry);
        const material = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,
            roughness: 0.5,
            metalness: 0.1,
            flatShading: true
        });
        if (geometry.attributes.color) {
            material.vertexColors = true;
        }
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        updateScene(mesh, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        console.error('An error occurred while loading the PLY file:', err);
        setErrorMessage("An error occurred while loading the PLY file.");
    });
}

/**
 * handleSTL
 * Loads and renders an STL file format into the Three.js scene.
 *
 * @param {Object} scene - The Three.js scene to which the geometry is added.
 * @param {string} url - The file URL or path.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.js camera.
 * @param {Object} controls - OrbitControls object for model interaction.
 * @param {Function} setErrorMessage - Function to set an error message.
 * @param {Function} setDetails - Function to update the model's details (vertices, triangles, etc.).
 */
export function handleSTL(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new STLLoader();
    loader.load(url, geometry => {
        console.log('STL Loaded:', geometry);
        const material = new THREE.MeshStandardMaterial({ color: 0xc8c8c8 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        updateScene(mesh, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        console.error('An error occurred while loading the STL file:', err);
        setErrorMessage("An error occurred while loading the STL file.");
    });
}

/**
 * handleFBX
 * Loads and renders an FBX file format into the Three.js scene.
 *
 * @param {Object} scene - The Three.js scene to which the FBX object is added.
 * @param {string} url - The file URL or path.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.js camera.
 * @param {Object} controls - OrbitControls object for model interaction.
 * @param {Function} setErrorMessage - Function to set an error message.
 * @param {Function} setDetails - Function to update the model's details (vertices, triangles, etc.).
 */
export function handleFBX(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new FBXLoader();
    loader.load(url, fbx => {
        console.log('FBX Loaded:', fbx);
        fbx.traverse(child => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: child.material.color,
                    roughness: 0.5,
                    metalness: 0.1,
                    flatShading: false
                });
            }
        });
        scene.add(fbx);
        updateScene(fbx, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        console.error('An error occurred while loading the FBX file:', err);
        setErrorMessage("An error occurred while loading the FBX file.");
    });
}

/**
 * handleDefault
 * Handles the loading and rendering of other types of 3D files if not OBJ, PLY, STL, or FBX.
 *
 * @param {Object} loader - The 3D file loader specific to the file format.
 * @param {string} url - The file URL or path.
 * @param {Object} scene - The Three.js scene to which the object is added.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.js camera.
 * @param {Object} controls - OrbitControls object for model interaction.
 * @param {Function} setErrorMessage - Function to set an error message.
 * @param {Function} setDetails - Function to update the model's details (vertices, triangles, etc.).
 */
export function handleDefault(loader, url, scene, renderer, camera, controls, setErrorMessage, setDetails) {
    loader.load(url, loadedObject => {
        console.log('Loaded Object:', loadedObject);
        let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
        if (loadedObject instanceof THREE.BufferGeometry) {
            objectToAdd = new THREE.Mesh(loadedObject, new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                roughness: 0.5,
                metalness: 0.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            }));
        }
        scene.add(objectToAdd);
        updateScene(objectToAdd, scene, renderer, camera, controls, setDetails);
    }, undefined, error => {
        console.error('An error occurred while loading the model:', error);
        setErrorMessage("An error occurred while loading the model.");
    });
}

/**
 * updateScene
 * Updates the scene, camera, and controls after loading the object.
 * This adjusts camera positioning, handles model animation, and updates details like vertices and surface area.
 *
 * @param {Object} object - The loaded 3D object or geometry.
 * @param {Object} scene - The Three.js scene to which the object is added.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.jsHere’s a continued version with a function header for `updateScene`:

```javascript
/**
 * updateScene
 * Updates the scene, camera, and controls after loading the object.
 * This adjusts camera positioning, handles model animation, and updates details like vertices and surface area.
 *
 * @param {Object} object - The loaded 3D object or geometry.
 * @param {Object} scene - The Three.js scene to which the object is added.
 * @param {Object} renderer - The Three.js WebGL renderer.
 * @param {Object} camera - The Three.js camera.
 * @param {Object} controls - OrbitControls object for model interaction.
 * @param {Function} setDetails - Function to update the model's details (vertices, triangles, surface area, etc.).
 */
function updateScene(object, scene, renderer, camera, controls, setDetails) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));

    camera.position.set(center.x, center.y - (size.y / 4), cameraZ * 5);
    camera.lookAt(center);

    controls.target.copy(center);
    controls.update();

    const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };

    animate();

    object.traverse(child => {
        if (child.isMesh && child.geometry) {
            const { area, volume } = calculateMeshProperties(child.geometry);
            const vertices = child.geometry.attributes.position.count;
            const triangles = child.geometry.index ? child.geometry.index.count / 3 : vertices / 3;
            setDetails(prevDetails => ({
                ...prevDetails,
                vertices: prevDetails.vertices + vertices,
                triangles: prevDetails.triangles + triangles,
                sizeX: size.x,
                sizeY: size.y,
                sizeZ: size.z,
                surfaceArea: area,
                volume: volume
            }));
        }
    });
}
