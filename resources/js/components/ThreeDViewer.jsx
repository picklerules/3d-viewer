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
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            scene.add(gltf.scene);
            const box = new THREE.Box3().setFromObject(gltf.scene);
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
            console.error('An error occurred while loading the GLTF:', error);
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

    return <div ref={mountRef} className="viewer-container"></div>;
}

export default ThreeDViewer;
