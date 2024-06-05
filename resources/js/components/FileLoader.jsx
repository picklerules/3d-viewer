import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import * as THREE from 'three';
import { calculateMeshProperties } from './MeshProperties';

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

export function handleOBJ(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new OBJLoader();
    loader.load(url, obj => {
        obj.traverse(child => {
            if (child.isMesh && child.material) {
                applyMaterialColor(child.material);
            }
        });
        scene.add(obj);
        updateScene(obj, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        setErrorMessage("An error occurred while loading the OBJ file.");
    });
}

export function handlePLY(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new PLYLoader();
    loader.load(url, geometry => {
        const material = new THREE.MeshPhongMaterial({
            color: 0xc8c8c8,
            specular: 0x000000,
            shininess: 30,
            flatShading: true
        });
        if (geometry.attributes.color) {
            material.vertexColors = true;
        }
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        updateScene(mesh, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        setErrorMessage("An error occurred while loading the PLY file.");
    });
}

export function handleSTL(scene, url, renderer, camera, controls, setErrorMessage, setDetails) {
    const loader = new STLLoader();
    loader.load(url, geometry => {
        const material = new THREE.MeshPhongMaterial({ color: 0xc8c8c8 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        updateScene(mesh, scene, renderer, camera, controls, setDetails);
    }, undefined, err => {
        setErrorMessage("An error occurred while loading the STL file.");
    });
}

export function handleDefault(loader, url, scene, renderer, camera, controls, setErrorMessage, setDetails) {
    loader.load(url, loadedObject => {
        let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
        if (loadedObject instanceof THREE.BufferGeometry) {
            objectToAdd = new THREE.Mesh(loadedObject, new THREE.MeshPhongMaterial({ color: 0xffffff }));
        }
        scene.add(objectToAdd);
        updateScene(objectToAdd, scene, renderer, camera, controls, setDetails);
    }, undefined, error => {
        setErrorMessage("An error occurred while loading the model.");
    });
}

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

function applyMaterialColor(material) {
    switch (material.name.toLowerCase()) {
        case 'red':
            material.color.set(0xff0000);
            break;
        case 'green':
            material.color.set(0x00ff00);
            break;
        case 'blue':
            material.color.set(0x0000ff);
            break;
        case 'orange':
            material.color.set(0xffa500);
            break;
        case 'purple':
            material.color.set(0x800080);
            break;
        case 'yellow':
            material.color.set(0xffff00);
            break;
        case 'cyan':
            material.color.set(0x00ffff);
            break;
        case 'magenta':
            material.color.set(0xff00ff);
            break;
        case 'black':
            material.color.set(0x000000);
            break;
        case 'white':
            material.color.set(0xffffff);
            break;
        case 'gray':
            material.color.set(0x808080);
            break;
        default:
            material.color.set(0xffffff);
            break;
    }
    material.needsUpdate = true;
}
