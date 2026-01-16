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


  // const uvVertices = Vertices;  // lấy lại dạng 2 chiều để tạo UV
  // const uvFaces = Faces;
  // const uvs = createBoxUVs(uvVertices, uvFaces);

  // Chuyển UV nếu có
  // Lấy UV của từng face, cho mỗi đỉnh
  // const uvs = [];
  // if (Uvs.length > 0) {
  //   // const faceUv = Uvs;
  //   Uvs.forEach(uvArr => { uvArr.forEach(([x,y]) => { uvs.push(x, y) }) });
  // }

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









function filterFacesByNormal(geometry, targetNormal = new THREE.Vector3(0,1,0), threshold = 0.9) {
  const position = geometry.attributes.position;
  const index = geometry.index;

  // Lưu mặt và diện tích mặt nếu vượt threshold
  const faces = [];

  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const triangleCount = index.count / 3;

  for (let i = 0; i < triangleCount; i++) {
    const aIndex = index.getX(i * 3);
    const bIndex = index.getX(i * 3 + 1);
    const cIndex = index.getX(i * 3 + 2);

    va.fromBufferAttribute(position, aIndex);
    vb.fromBufferAttribute(position, bIndex);
    vc.fromBufferAttribute(position, cIndex);

    ab.subVectors(vb, va);
    ac.subVectors(vc, va);
    normal.crossVectors(ab, ac).normalize();

    if (normal.dot(targetNormal) > threshold) {
      // Tính diện tích mặt tam giác = 0.5 * chiều dài tích chéo 2 cạnh
      const area = 0.5 * ab.cross(ac).length();

      faces.push({
        indices: [aIndex, bIndex, cIndex],
        area: area,
      });
    }
  }




  faces.sort((f1, f2) => f2.area - f1.area);
  const top2Faces = faces.slice(0, 2);
  const newIndices = top2Faces.flatMap(face => face.indices);
  geometry.setIndex(newIndices);





  geometry.computeVertexNormals();

  return geometry;
}

