import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ThreeDViewer({ file }) {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!file) return;

        if (!file.type && file.name.endsWith('.glb')) {
            Object.defineProperty(file, "type", { value: 'model/gltf-binary' });
        }

        console.log("Processed file type:", file.type);  

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        const url = URL.createObjectURL(file);
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            scene.add(gltf.scene);
            camera.position.set(0, 0, 5);
            camera.lookAt(gltf.scene.position);
        }, undefined, (error) => {
            console.error('An error occurred while loading the GLTF:', error);
        });

        const controls = new OrbitControls(camera, renderer.domElement);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            mountRef.current.removeChild(renderer.domElement);
            URL.revokeObjectURL(url);
        };
    }, [file]);

    return <div ref={mountRef} style={{ height: '100vh' }}></div>;
}

export default ThreeDViewer;
