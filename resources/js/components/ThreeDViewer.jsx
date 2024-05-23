import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function calculateMeshProperties(geometry) {
    let totalArea = 0;
    let totalVolume = 0;
    const vertices = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;

    if (indices) {
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
        if (!file) {
            return () => {
                if (mountRef.current) {
                    while (mountRef.current.firstChild) {
                        mountRef.current.removeChild(mountRef.current.firstChild);
                    }
                }
            };
        }

        setDetails({
            vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0
        });
        setErrorMessage("");
        setFileInfo({
            fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadDate: new Date().toLocaleDateString()
        });

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0xffffff);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        const url = URL.createObjectURL(file);
        const loader = selectLoader(file.name);
        if (!loader) {
            setErrorMessage("Unsupported file format");
            return;
        }

        loader.load(url, (loadedObject) => {
            let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
            if (loadedObject instanceof THREE.BufferGeometry) {
                objectToAdd = new THREE.Mesh(loadedObject, new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    specular: 0x222222,
                    shininess: 100,
                    reflectivity: 0.5
                }));
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

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            URL.revokeObjectURL(url);
        };
    }, [file]);

    function selectLoader(filename) {
        const extension = filename.toLowerCase().split('.').pop();
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
