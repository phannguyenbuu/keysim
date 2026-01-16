import * as THREE from "three";
import store from "../../store/store";
import holes from "./holes";
import { pushFaceVertexUvs } from "./case_2";

export default (layout, color) => {
  color = color || "#cccccc";
  let cornerRadius = 0.5;
  let bevel = 0.05;
  let bezel = 0.5;
  let height = 1;
  let width = layout.width + bezel * 2;
  let depth = layout.height + bezel * 2;
  let size = store.getState().case.layout;
  let geometry;
  let mesh;

  //create geometry
  let shape = new THREE.Shape();

  //basic outline
  shape.moveTo(0, cornerRadius);
  shape.quadraticCurveTo(0, 0, cornerRadius, 0);
  shape.lineTo(width - cornerRadius, 0);
  shape.quadraticCurveTo(width, 0, width, cornerRadius);
  shape.lineTo(width, depth - cornerRadius);
  shape.quadraticCurveTo(width, depth, width - cornerRadius, depth);
  shape.lineTo(cornerRadius, depth);
  shape.quadraticCurveTo(0, depth, 0, depth - cornerRadius);
  shape.lineTo(0, cornerRadius);

  shape.holes = holes(size, layout, bezel);

  let extrudeOptions = {
    depth: height,
    steps: 1,
    bevelSegments: 1,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
  };

  geometry = new THREE.ExtrudeGeometry(shape, extrudeOptions);
  pushFaceVertexUvs(geometry);

  applyFaceMaterialByNormal(geometry);
  
  // for (let i = 0; i < geometry.faces.length; i++) {
  //   const f = geometry.faces[i];
  //   //all faces geneated from the extrusion (side faces)
  //   if (!f.normal.z) {
  //     f.materialIndex = 1;
  //   } else {
  //     f.materialIndex = 0;
  //   }
  // }

  //create mesh
  mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: color })
  );
  mesh.name = "CASE";
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(-bezel, 0, -bezel);

  return mesh;
};


function applyFaceMaterialByNormal(geometry) {
  // Nếu chưa có group nào, tạo group mặc định cho từng mặt tam giác (3 vertex = 1 mặt)
  if (!geometry.groups || geometry.groups.length === 0) {
    const count = geometry.index ? geometry.index.count : geometry.attributes.position.count;
    geometry.clearGroups();
    for (let i = 0; i < count / 3; i++) {
      geometry.addGroup(i * 3, 3, 0);
    }
  }

  // Tính vector pháp tuyến trung bình của mỗi mặt nhóm 3 index để xác định mặt
  const position = geometry.attributes.position;
  const index = geometry.index ? geometry.index.array : null;

  const vectorA = new THREE.Vector3();
  const vectorB = new THREE.Vector3();
  const vectorC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  geometry.groups.forEach((group, i) => {
    let faceNormalZ = 0;

    // Lấy vị trí tam giác
    for (let j = group.start; j < group.start + group.count; j += 3) {
      if (index) {
        vectorA.fromBufferAttribute(position, index[j]);
        vectorB.fromBufferAttribute(position, index[j + 1]);
        vectorC.fromBufferAttribute(position, index[j + 2]);
      } else {
        vectorA.fromBufferAttribute(position, j);
        vectorB.fromBufferAttribute(position, j + 1);
        vectorC.fromBufferAttribute(position, j + 2);
      }

      cb.subVectors(vectorC, vectorB);
      ab.subVectors(vectorA, vectorB);
      cb.cross(ab);
      cb.normalize();

      faceNormalZ = cb.z;
    }

    // Gán materialIndex phụ thuộc vào normal.z
    if (Math.abs(faceNormalZ) < 0.0001) {
      group.materialIndex = 1; // side face
    } else {
      group.materialIndex = 0; // top face (normal.z khác 0)
    }
  });

  geometry.groupsNeedUpdate = true;

}