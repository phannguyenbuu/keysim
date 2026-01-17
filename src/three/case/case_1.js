import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const caseCache = {}; // Cache theo layout

export default async (layout, color, size) => {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/case.glb');
  const scene = gltf.scene.clone();
  scene.name = "CASE";
//   scene.position.set(8,-0.8,3);
//   scene.scale.setScalar(0.018);
  scene.traverse(child => child.isMesh && (child.castShadow = child.receiveShadow = true));
  
  // ✅ Tìm KC_ESC position từ GLB
  // const escObj = scene.getObjectByName('KC_F1');
  // const escPos = escObj ? escObj.position.clone() : new THREE.Vector3();
  // console.log('ESC pos from GLB:', escPos.toArray());

  // const offset = new THREE.Vector3(-0.6,-0.8,-0.4);
  
  // return {
  //   mesh: scene,
  //   escPosition:  new THREE.Vector3(escPos.x * 0.03937,
  //                               escPos.y * 0.03937,
  //                               escPos.z * 0.03937).add(scene.position).add(offset)
    
  // };

  const keyPositions = {};

  scene.traverse(obj => {
    if (obj.name && obj.name.startsWith("KC_")) {
      keyPositions[obj.name] = obj.position.clone();
      obj.visible = false;
    }
  });

  console.log("KEY POSITIONS FROM GLB:", keyPositions);

  const SCALE = 0.03937;
  const offset = new THREE.Vector3(-0.48, -0.8, -0.4);

  // ✅ SCALE + OFFSET (giống logic cũ của bạn)
  Object.keys(keyPositions).forEach(code => {
    keyPositions[code]
      .multiplyScalar(SCALE)
      .add(scene.position)
      .add(offset);
  });

  return {
    mesh: scene,          // 👉 vẫn render bình thường
    keyPositions          // 👉 toàn bộ KC_*
  };
}
