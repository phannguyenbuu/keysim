import * as THREE from "three";
import store from "../../store/store";
import holes from "./holes";

export default (layout, color) => {
  color = color || "#cccccc";
  let cornerRadius = 0;
  let bevel = 0.04;
  let bezel = 0.25;
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
  shape.lineTo(width - cornerRadius, 0);
  shape.lineTo(width, depth - cornerRadius);
  shape.lineTo(cornerRadius, depth);
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

  // for (let i = 0; i < geometry.vertices.length; i++) {
  //   let v = geometry.vertices[i];
  //   if (v.z > 0.5 && v.y < 0.7) {
  //     if (depth > 6) {
  //       v.z += 0.67;
  //     } else if (depth > 5) {
  //       v.z += 0.55;
  //     } else {
  //       v.z += 0.5;
  //     }
  //   }
  // }


  const positionAttr = geometry.attributes.position;
  const vertexCount = positionAttr.count;

  for (let i = 0; i < vertexCount; i++) {
    // Lấy vị trí đỉnh i dưới dạng Vector3
    const v = new THREE.Vector3().fromBufferAttribute(positionAttr, i);

    if (v.z > 0.5 && v.y < 0.7) {
      if (depth > 6) {
        v.z += 0.67;
      } else if (depth > 5) {
        v.z += 0.55;
      } else {
        v.z += 0.5;
      }
      // Cập nhật vị trí đỉnh trong attribute
      positionAttr.setXYZ(i, v.x, v.y, v.z);
    }
  }

  // Báo hiệu rằng attribute thay đổi, Three.js sẽ cập nhật trên GPU
  positionAttr.needsUpdate = true;




  // geometry.faceVertexUvs.push(geometry.faceVertexUvs[0]);

  // for (let i = 0; i < geometry.faces.length; i++) {
  //   const f = geometry.faces[i];
  //   //all faces geneated from the extrusion (side faces)
  //   if (!f.normal.z) {
  //     f.materialIndex = 1;
  //   } else {
  //     f.materialIndex = 0;
  //   }
  // }

  

    pushFaceVertexUvs(geometry);
    geometry.groups.forEach((group, i) => {
      // Giả sử nhóm nhỏ hơn threshold hoặc một chỉ số nhất định là 'top'
      if (group.start / 3 < 8) { // vd: 8 nhóm đầu là 'top'
        group.materialIndex = 0;
      } else {
        group.materialIndex = 1;
      }
    });

    // Cập nhật lại groups
    geometry.groupsNeedUpdate = true;



  // Giả sử mesh.geometry là BufferGeometry



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


export function pushFaceVertexUvs(geometry) {
    // const geometry = mesh.geometry;

    // Nếu chưa có groups, tạo nhóm mặc định (mỗi 3 index là 1 mặt tam giác)
    if (!geometry.groups || geometry.groups.length === 0) {
      const count = geometry.index ? geometry.index.count : geometry.attributes.position.count;
      geometry.groups = [];
      for (let i = 0; i < count / 3; i++) {
        geometry.groups.push({
          start: i * 3,
          count: 3,
          materialIndex: 0,
        });
      }
    }

    // Không còn face.normal, nên ta tính rough normal dựa trên group index
    // Ở đây ta giả sử group đầu là top (materialIndex 0), group còn lại là side (1)
    
}