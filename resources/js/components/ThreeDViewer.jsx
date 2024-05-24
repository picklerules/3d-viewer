import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Function to calculate the surface area and volume of the mesh
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
        // Simple estimation for non-indexed meshes
        // Using each group of nine elements to form an approximate triangle
        for (let i = 0; i < vertices.length; i += 9) { // Each 9 elements represent 3 points (x, y, z for each point)
            const vA = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
            const vB = new THREE.Vector3(vertices[i+3], vertices[i+4], vertices[i+5]);
            const vC = new THREE.Vector3(vertices[i+6], vertices[i+7], vertices[i+8]);

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

// Function to get material settings based on the file extension
function getMaterialSettings(extension) {
    switch (extension) {
        case 'stl':
            return { color: 0xdddddd, shininess: 10, specular: 0x111111, reflectivity: 0.1 };
        case 'ply':
            return { color: 0xaaaaaa, shininess: 50, specular: 0x222222, reflectivity: 0.3 };
        case 'vrml':
        case 'wrl':
            return { color: 0xcccccc, shininess: 75, specular: 0x444444, reflectivity: 0.4 };
        default:
            return { color: 0xffffff, shininess: 100, specular: 0x222222, reflectivity: 0.5 };
    }
}

// Main component for 3D model viewing
function ThreeDViewer({ file }) {
    const mountRef = useRef(null);
    const [details, setDetails] = useState({
        vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [fileInfo, setFileInfo] = useState({ fileSize: 0, uploadDate: '' });

    useEffect(() => {
        if (!file) {
            return () => {
                if (mountRef.current) {
                    while (mountRef.current.firstChild) {
                        mountRef.current.removeChild(mountRef.current.firstChild);
                    }
                }
            };
        }

        // Reset details and error messages
        setDetails({
            vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0
        });
        setErrorMessage("");
        setFileInfo({
            fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadDate: new Date().toLocaleDateString()
        });

        // Set up the scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0xffffff);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Add lighting to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Load the 3D model
        const url = URL.createObjectURL(file);
        const loader = selectLoader(file.name.split('.').pop());
        if (!loader) {
            setErrorMessage("Unsupported file format");
            return;
        }

        loader.load(url, (loadedObject) => {
            let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
            if (loadedObject instanceof THREE.BufferGeometry) {
                const materialSettings = getMaterialSettings(file.name.split('.').pop());
                objectToAdd = new THREE.Mesh(loadedObject, new THREE.MeshPhongMaterial(materialSettings));
            }

            scene.add(objectToAdd);

            // Adjust the camera and controls to fit the model
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

            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };

            animate();

            // Calculate and set details for the model
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

        // Cleanup function to remove the renderer
        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            URL.revokeObjectURL(url);
        };
    }, [file]);

    // Function to select the appropriate loader based on the file extension
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
