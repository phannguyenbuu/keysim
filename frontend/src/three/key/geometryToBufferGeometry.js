import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
// import uv_keys from '../../json/uv_key.json';

export default function geometryToBufferGeometry(Vertices, Faces, Uvs) {
  // Lấy vertices từ geometry cũ
  const vertices = [];
  Vertices.forEach(([x,y,z]) => {
    vertices.push(x, y, z);
  });

  // Lấy faces từ faces
  const faces = [];
  Faces.forEach(([a,b,c]) => {
    faces.push(a, b, c);
  });



  // Tạo BufferGeometry mới
  let bufferGeometry = new THREE.BufferGeometry();

  // Gán attribute position
  bufferGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices), 3)
  );

  // Gán index
  bufferGeometry.setIndex(faces);

  // bufferGeometry = filterFacesByNormal(bufferGeometry);

  bufferGeometry = bufferGeometry.toNonIndexed();
  bufferGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(Uvs), 2));
  bufferGeometry.attributes.uv.needsUpdate = true;
  // Tính pháp tuyến
  
  // setUVsForMesh(bufferGeometry, Uvs.flat());
  bufferGeometry.computeVertexNormals();
  return bufferGeometry;
}

