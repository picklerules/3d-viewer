import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FileLoader, handlePLY, handleOBJ, handleSTL, handleDefault } from './FileLoader';
import { calculateMeshProperties } from './MeshProperties';
import { LightingSetup } from './LightingSetup';

function ThreeDViewer({ file }) {
    const mountRef = useRef(null);
    const [details, setDetails] = useState({
        vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [fileInfo, setFileInfo] = useState({ fileSize: 0, uploadDate: '' });
    // const [textureFile, setTextureFile] = useState(null);

    useEffect(() => {
        if (!file) return;

        setDetails({ vertices: 0, triangles: 0, sizeX: 0, sizeY: 0, sizeZ: 0, surfaceArea: 0, volume: 0 });
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

        // Add lights to the scene
        LightingSetup(scene);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;

        const url = URL.createObjectURL(file);
        const loader = FileLoader(file.name.split('.').pop().toLowerCase());

        if (!loader) {
            setErrorMessage("Unsupported file format");
            return;
        }

        const fileType = file.name.split('.').pop().toLowerCase();
        switch (fileType) {
            case 'obj':
                handleOBJ(scene, url, renderer, camera, controls, setErrorMessage, setDetails);
                break;
            case 'ply':
                handlePLY(scene, url, renderer, camera, controls, setErrorMessage, setDetails);
                break;
            case 'stl':
                handleSTL(scene, url, renderer, camera, controls, setErrorMessage, setDetails);
                break;
            default:
                handleDefault(loader, url, scene, renderer, camera, controls, setErrorMessage, setDetails);
        }

        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            URL.revokeObjectURL(url);
        };
    }, [file]);

    // Allow user to upload a texture file
    // const handleTextureUpload = (event) => {
    //     setTextureFile(event.target.files[0]);
    // };

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
            {/* <input type="file" onChange={handleTextureUpload} /> */}
        </div>
    );
}

export default ThreeDViewer;
