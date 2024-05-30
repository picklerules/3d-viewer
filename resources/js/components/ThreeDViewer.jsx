import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Function to calculate the properties of the mesh (area and volume)
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

        // Reset details and error message
        setDetails({ vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0 });
        setErrorMessage("");
        setFileInfo({
            fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadDate: new Date().toLocaleDateString()
        });

        // Initialize the scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0xffffff);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Add lights
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(-100, 0, 100);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.75);
        fillLight.position.set(100, 0, 100);
        const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
        backLight.position.set(0, 0, -100).normalize();
        scene.add(keyLight);
        scene.add(fillLight);
        scene.add(backLight);

        const url = URL.createObjectURL(file);
        const loader = selectLoader(file.name.split('.').pop());
        if (!loader) {
            setErrorMessage("Unsupported file format");
            return;
        }

        loader.load(url, (loadedObject) => {
            let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
            if (loadedObject instanceof THREE.BufferGeometry) {
                objectToAdd = new THREE.Mesh(loadedObject, new THREE.MeshPhongMaterial({ color: 0xffffff }));
            }

            // Log the entire structure of the model
            console.log('Loaded Object:', loadedObject);
            console.log('Scene Graph:', objectToAdd);

            // Handle OBJ files specifically
            if (file.name.split('.').pop().toLowerCase() === 'obj') {
                handleOBJ(objectToAdd, scene);
            } else {
                handleDefault(objectToAdd, scene);
            }

            scene.add(objectToAdd);

            const box = new THREE.Box3().setFromObject(objectToAdd);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
            camera.position.set(center.x, center.y - (size.y / 4), cameraZ * 5);
            camera.lookAt(center);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.target.copy(center);
            controls.update();

            const animate = () => {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };

            animate();

            objectToAdd.traverse(child => {
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
        }, undefined, (error) => {
            console.error('An error occurred while loading the model:', error);
            setErrorMessage("An error occurred while loading the model.");
        });

        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            URL.revokeObjectURL(url);
        };
    }, [file]);

    function selectLoader(extension) {
        switch (extension.toLowerCase()) {
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

    function handleOBJ(objectToAdd, scene) {
        objectToAdd.traverse(child => {
            if (child.isMesh && child.material) {
                if (child.material.color) {
                    console.log('Material Color:', child.material.color);
                }
                if (child.material.name) {
                    console.log('Material Name:', child.material.name);
                }
                if (child.material.color.r === 1 && child.material.color.g === 1 && child.material.color.b === 1) {
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
                        default:
                            child.material.color.set(0xffffff);
                    }
                }
                if (child.material.specular) {
                    console.log('Specular:', child.material.specular);
                }
                if (child.material.shininess !== undefined) {
                    console.log('Shininess:', child.material.shininess);
                }
            }
        });
    }

    function handleDefault(objectToAdd, scene) {
        objectToAdd.traverse(child => {
            if (child.isMesh && child.material) {
                if (child.material.color) {
                    console.log('Material Color:', child.material.color);
                }
                if (child.material.name) {
                    console.log('Material Name:', child.material.name);
                }
                if (child.material.specular) {
                    console.log('Specular:', child.material.specular);
                }
                if (child.material.shininess !== undefined) {
                    console.log('Shininess:', child.material.shininess);
                }
            }
        });
    }

    return (
        <div ref={mountRef} className="viewer-container position-relative">
            {errorMessage && <p className="error-message text-danger">{errorMessage}</p>}
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
                    <p>File Size: {fileInfo.fileSize}</p>
                    <p>Upload Date: {fileInfo.uploadDate}</p>
                </div>
            )}
        </div>
    );
}

export default ThreeDViewer;
