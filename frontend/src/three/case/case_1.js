import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const caseCache = {}; // Cache theo layout

export default async (layout, color, size) => {
  const loader = new GLTFLoader();
  const baseUrl = process.env.PUBLIC_URL || "";
  const gltf = await loader.loadAsync(`${baseUrl}/case.glb`);
  const scene = gltf.scene.clone();
  scene.name = "CASE";

  scene.traverse(child => child.isMesh && (child.castShadow = child.receiveShadow = true));
  
  const keyPositions = {};

  scene.traverse(obj => {
    if (obj.name && obj.name.startsWith("KC_")) {
      keyPositions[obj.name] = obj.position.clone();
      obj.visible = false;
    }
  });

  // console.log("KEY POSITIONS FROM GLB:", keyPositions);

  const SCALE = 0.03937;
  const offset = new THREE.Vector3(-0.48, -0.8, -0.4);

  // ✅ SCALE + OFFSET (giống logic cũ của bạn)
  Object.keys(keyPositions).forEach(code => {
    keyPositions[code]
      .multiplyScalar(SCALE)
      .add(scene.position)
      .add(offset);
  });

  const keySet = new Set(Object.keys(keyPositions));

  return {
    mesh: scene,
    keyPositions,
    keySet
  };
}
