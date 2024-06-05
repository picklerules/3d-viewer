import * as THREE from 'three';

export function calculateMeshProperties(geometry) {
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
