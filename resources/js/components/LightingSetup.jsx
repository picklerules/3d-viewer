import * as THREE from 'three';

export function LightingSetup(scene) {
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);
}
