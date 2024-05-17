import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ThreeDViewer({ file }) {
    const mountRef = useRef(null);
    const [details, setDetails] = useState({ vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0 });

    useEffect(() => {
        if (!file) return;

        const loader = selectLoader(file.name);
        if (!loader) {
            console.error('Unsupported file format');
            return;
        }

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
        loader.load(url, (loadedObject) => {
            let objectToAdd = loadedObject.scene ? loadedObject.scene : loadedObject;
            if (loadedObject instanceof THREE.BufferGeometry) {
                const material = new THREE.MeshPhongMaterial({
                    color: 0xffffff,  
                    specular: 0x222222,
                    shininess: 100,
                    reflectivity: 0.5
                });
                objectToAdd = new THREE.Mesh(loadedObject, material);
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
                    child.geometry.computeBoundingBox();
                    const vertices = child.geometry.attributes.position.count;
                    const triangles = child.geometry.index ? child.geometry.index.count / 3 : vertices / 3;
                    setDetails(prevDetails => ({
                        vertices: prevDetails.vertices + vertices,
                        triangles: prevDetails.triangles + triangles,
                        sizeX: size.x,
                        sizeY: size.y,
                        sizeZ: size.z
                    }));
                }
            });

        }, undefined, (error) => {
            console.error('An error occurred while loading the model:', error);
        });

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        return () => {
            mountRef.current.removeChild(renderer.domElement);
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
            default:
                return null;
        }
    }

    return (
        <div ref={mountRef} className="viewer-container">
            {details.vertices > 0 && (
                <div className="details-panel">
                    <h4>Details</h4>
                    <p>Vertices: {details.vertices}</p>
                    <p>Triangles: {details.triangles}</p>
                    <p>Size X: {details.sizeX.toFixed(2)}</p>
                    <p>Size Y: {details.sizeY.toFixed(2)}</p>
                    <p>Size Z: {details.sizeZ.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
}

export default ThreeDViewer;
