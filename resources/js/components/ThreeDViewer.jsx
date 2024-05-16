import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ThreeDViewer({ file }) {
    const mountRef = useRef(null);

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

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, 1, 0);
        scene.add(directionalLight);

        const url = URL.createObjectURL(file);
        loader.load(url, (loadedObject) => {
            let objectToAdd = loadedObject;
         
            if (loadedObject instanceof THREE.BufferGeometry) {
                const material = new THREE.MeshPhongMaterial({ color: 0x555555, specular: 0x111111, shininess: 200 });
                objectToAdd = new THREE.Mesh(loadedObject, material);
            } else if (loadedObject.scene) { 
                objectToAdd = loadedObject.scene;
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
        }, undefined, (error) => {
            console.error('An error occurred while loading the model:', error);
        });

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

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

    return <div ref={mountRef} className="viewer-container"></div>;
}

export default ThreeDViewer;
