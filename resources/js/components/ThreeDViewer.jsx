import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Function to calculate mesh properties: surface area and volume
function calculateMeshProperties(geometry) {
    let totalArea = 0;
    let totalVolume = 0;
    const vertices = geometry.attributes.position.array;

    if (geometry.index) {
        const indices = geometry.index.array;
        const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
        const cross = new THREE.Vector3();

        for (let i = 0; i < indices.length; i += 3) {
            const iA = indices[i] * 3;
            const iB = indices[i + 1] * 3;
            const iC = indices[i + 2] * 3;

            vA.fromArray(vertices, iA);
            vB.fromArray(vertices, iB);
            vC.fromArray(vertices, iC);

            cross.crossVectors(vB.sub(vA), vC.sub(vA));
            totalArea += cross.length() / 2;
            totalVolume += vA.dot(cross) / 6;
        }
    } else {
        for (let i = 0; i < vertices.length; i += 9) {
            const vA = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
            const vB = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
            const vC = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

            const cross = new THREE.Vector3();
            cross.crossVectors(vB.sub(vA), vC.sub(vA));
            totalArea += cross.length() / 2;
            totalVolume += vA.dot(cross) / 6;
        }
    }

    return {
        area: totalArea,
        volume: Math.abs(totalVolume)
    };
}

function ThreeDViewer({ file }) {
    const mountRef = useRef(null);
    const [details, setDetails] = useState({
        vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [fileInfo, setFileInfo] = useState({ fileSize: 0, uploadDate: '' });

    useEffect(() => {
        if (!file) return;

        setDetails({ vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0 });
        setErrorMessage("");
        setFileInfo({
            fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadDate: new Date().toLocaleDateString()
        });

        // Initialize scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0xffffff);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Add lights to the scene
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(-100, 0, 100);
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
        fillLight.position.set(100, 0, 100);
        const backLight = new THREE.DirectionalLight(0xffffff, 1.2);
        backLight.position.set(0, 0, -100).normalize();
        const spotLight = new THREE.SpotLight(0xffffff, 1.7);
        spotLight.position.set(2, 3, 2);
        spotLight.castShadow = true;
        scene.add(keyLight, fillLight, backLight, spotLight);
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Load the 3D model
        const url = URL.createObjectURL(file);
        const loader = selectLoader(file.name.split('.').pop().toLowerCase());
        if (!loader) {
            setErrorMessage("Unsupported file format");
            return;
        }

        // Handle loading based on file type
        if (file.name.split('.').pop().toLowerCase() === 'obj') {
            handleOBJ(scene, url, renderer, camera, spotLight);
        } else if (file.name.split('.').pop().toLowerCase() === 'ply') {
            handlePLY(scene, url, renderer, camera, spotLight);
        } else if (file.name.split('.').pop().toLowerCase() === 'stl') {
            handleSTL(scene, url, renderer, camera, spotLight);
        } else {
            handleDefault(scene, url, loader, renderer, camera, spotLight);
        }

        // Cleanup on component unmount
        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            URL.revokeObjectURL(url);
        };
    }, [file]);

    // Function to select the appropriate loader based on file extension
    function selectLoader(extension) {
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

    // Function to handle loading and processing of OBJ files
    function handleOBJ(scene, url, renderer, camera, spotLight) {
        const objLoader = new OBJLoader();

        objLoader.load(url, obj => {
            console.log('OBJ Loaded:', obj);
            obj.traverse(child => {
                if (child.isMesh) {
                    console.log('Child Material:', child.material);
                    if (child.material) {
                        // Apply colors based on material names
                        switch (child.material.name.toLowerCase()) {
                            case 'red':
                                child.material.color.set(0xff0000);
                                break;
                            case 'green':
                                child.material.color.set(0x00ff00);
                                break;
                            case 'blue':
                                child.material.color.set(0x0000ff);
                                break;
                            case 'orange':
                                child.material.color.set(0xffa500);
                                break;
                            case 'purple':
                                child.material.color.set(0x800080);
                                break;
                            case 'yellow':
                                child.material.color.set(0xffff00);
                                break;
                            case 'cyan':
                                child.material.color.set(0x00ffff);
                                break;
                            case 'magenta':
                                child.material.color.set(0xff00ff);
                                break;
                            case 'black':
                                child.material.color.set(0x000000);
                                break;
                            case 'white':
                                child.material.color.set(0xffffff);
                                break;
                            case 'gray':
                                child.material.color.set(0x808080);
                                break;
                            // Add more colors as needed
                            default:
                                child.material.color.set(0xffffff); // Default to white if no match
                                break;
                        }
                        child.material.needsUpdate = true;
                    }
                }
            });
            scene.add(obj);
            updateScene(obj, scene, renderer, camera, spotLight);
        }, undefined, err => {
            console.error('An error occurred while loading the OBJ file:', err);
            setErrorMessage("An error occurred while loading the model.");
        });
    }

    // Function to handle loading and processing of PLY files
    function handlePLY(scene, url, renderer, camera, spotLight) {
        const plyLoader = new PLYLoader();

        plyLoader.load(url, geometry => {
            console.log('PLY Loaded:', geometry);

            // Inspect the attributes to check for color
            console.log('PLY Attributes:', geometry.attributes);

            // Create material with specified properties
            const material = new THREE.MeshPhongMaterial({
                color: 0xc8c8c8, // Default color
                specular: 0x000000, // Specular color
                shininess: 30, // Adjust as necessary
                flatShading: true
            });

            // Check if the PLY file has vertex colors
            if (geometry.attributes.color) {
                material.vertexColors = true;
            }

            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            updateScene(mesh, scene, renderer, camera, spotLight);
        }, undefined, err => {
            console.error('An error occurred while loading the PLY file:', err);
            setErrorMessage("An error occurred while loading the model.");
        });
    }

    // Function to handle loading and processing of STL files
    function handleSTL(scene, url, renderer, camera, spotLight) {
        const stlLoader = new STLLoader();

        stlLoader.load(url, geometry => {
            console.log('STL Loaded:', geometry);

            const material = new THREE.MeshPhongMaterial({ color: 0xc8c8c8 });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            updateScene(mesh, scene, renderer, camera, spotLight);
        }, undefined, err => {
            console.error('An error occurred while loading the STL file:', err);
            setErrorMessage("An error occurred while loading the model.");
        });
    }
    

    // Function to handle loading and processing of other file types
    function handleDefault(scene, url, loader, renderer, camera, spotLight) {
        loader.load(url, loadedObject => {
            let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
            if (loadedObject instanceof THREE.BufferGeometry) {
                objectToAdd = new THREE.Mesh(loadedObject, new THREE.MeshPhongMaterial({ color: 0xffffff }));
            }

            console.log('Loaded Object:', loadedObject);
            console.log('Scene Graph:', objectToAdd);

            scene.add(objectToAdd);
            updateScene(objectToAdd, scene, renderer, camera, spotLight);
        }, undefined, error => {
            console.error('An error occurred while loading the model:', error);
            setErrorMessage("An error occurred while loading the model.");
        });
    }

    // Function to update the scene with the loaded object
    function updateScene(object, scene, renderer, camera, spotLight) {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        camera.position.set(center.x, center.y - (size.y / 4), cameraZ * 5);
        camera.lookAt(center);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(center);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.update();

        const animate = () => {
            requestAnimationFrame(animate);
            spotLight.position.x = center.x + Math.sin(Date.now() * 0.001) * 3;
            spotLight.position.z = center.z + Math.cos(Date.now() * 0.001) * 3;
            spotLight.lookAt(center);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Calculate mesh properties and update state
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

    return (
        <div ref={mountRef} className="viewer-container position-relative">
            {errorMessage && <div className="alert alert-danger position-absolute w-100 text-center" style={{ top: 0 }}>{errorMessage}</div>}
            {details.vertices > 0 && (
                <div className="details-panel position-absolute top-0 right-0 p-3 bg-light">
                    <h4>Details</h4>
                    <p>Vertices: {details.vertices}</p>
                    <p>Triangles: {details.triangles}</p>
                    <p>Size X: {details.sizeX.toFixed(2)}</p>
                    <p>Size Y: {details.sizeY.toFixed(2)}</p>
                    <p>Size Z: {details.sizeZ.toFixed(2)}</p>
                    <p>Surface Area: {details.surfaceArea.toFixed(2)} square units</p>
                    <p>Volume: {details.volume.toFixed(2)} cubic units</p>
                </div>
            )}
        </div>
    );
}

export default ThreeDViewer;
