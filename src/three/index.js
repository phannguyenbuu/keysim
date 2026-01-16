import SceneManager from "./sceneManager";
import CaseManager from "./case/caseManager";
import KeyManager from "./key/keyManager";
import * as webfont from "webfontloader";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
const SCREEN_SCALE = 50;

export default (element) => {
  //ensure fonts loaded for canvas textures
  webfont.load({
    custom: {
      families: ["legends", "Varela Round"],
    },
    active: function () {
      //MAIN THREE JS SETUP
      //-------------------------------------
      const ThreeApp = new SceneManager({
        scale: SCREEN_SCALE,
        el: element,
      });

      const KEYS = new KeyManager({
        scene: ThreeApp.scene,
      });

      new CaseManager({
        scene: ThreeApp.scene,
      });

      // console.log('KEYS', KEYS.components.length, KEYS);

      setTimeout(() => {
        // loadFBX(ThreeApp.scene, './rfs.fbx');
        // exportFBX(ThreeApp.scene);
        // listObjs(ThreeApp.scene);
      }, 1000);

        

      //start render loop
      ThreeApp.add(KEYS);
      ThreeApp.tick();
    },
  });
};



function listObjs(scene) {
  const names = [];
  scene.traverse((object) => {
    if (object.name) { 
      names.push(object.name);
    }
  });
  console.log('Danh sách tên các object trong scene:', names);

}



function loadFBX(scene, file) {
  clearScene(scene);
        const loader = new FBXLoader();

        loader.load(file, (object) => {
          scene.add(object);
          logUVsFromObject(object);
        });
}






function exportFBX(scene) {
  exporter.parse(scene, function(result) {
          if(result instanceof ArrayBuffer) {
            // Khi xuất định dạng binary .glb
            saveArrayBuffer(result, 'scene.glb');
          } else {
            // Khi xuất định dạng .gltf JSON
            const output = JSON.stringify(result, null, 2);
            saveString(output, 'scene.gltf');
          }
        }, 
        function(error) {
          console.error('Lỗi khi xuất:', error);
        }, 
        { binary: true } // hoặc false cho JSON .gltf
        );

      
}


function logUVsFromObject(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      const geometry = child.geometry;
      if (geometry && geometry.attributes && geometry.attributes.uv) {
        const uvAttr = geometry.attributes.uv;
        const uvs = [];
        for (let i = 0; i < uvAttr.count; i++) {
          uvs.push([uvAttr.getX(i), uvAttr.getY(i)]);
        }
        console.log(`UVs của mesh ${child.name || child.id}:`, uvs);
      } else {
        console.log(`Mesh ${child.name || child.id} không có UV attribute.`);
      }
    }
  });
}




function clearScene(scene) {
  // Duyệt qua tất cả các đối tượng con trong scene
  scene.traverse(object => {
    if (object.geometry) {
      object.geometry.dispose(); // giải phóng geometry GPU
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => mat.dispose()); // nhiều vật liệu
      } else {
        object.material.dispose(); // vật liệu đơn
      }
    }
  });

  // Xóa tất cả đối tượng khỏi scene
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
}








const exporter = new GLTFExporter();

function saveString(text, filename) {
  const blob = new Blob([text], {type: 'text/plain'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function saveArrayBuffer(buffer, filename) {
  const blob = new Blob([buffer], {type: 'application/octet-stream'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}







const exportCombinedTexturesAsImage = (textures,keys, filename) => {
  if (!textures || textures.length === 0) {
    console.warn('Không có texture để ghép');
    return;
  }

  // Giả sử tất cả canvas có cùng kích thước, lấy từ canvas đầu tiên
  const canvasWidth = textures[0].image.width;
  const canvasHeight = textures[0].image.height;

  // Số cột mong muốn trong bảng (có thể thay đổi)
  const cols = 10;
  const rows = Math.ceil(textures.length / cols);

  // Tạo canvas tổng để ghép
  const combinedCanvas = document.createElement('canvas');
  combinedCanvas.width = cols * canvasWidth;
  combinedCanvas.height = rows * canvasHeight;
  const ctx = combinedCanvas.getContext('2d');

  // Vẽ từng texture lên canvas tổng theo vị trí bảng
  textures.forEach((texture, index) => {
    if(keys.components[index])
    {
      const x = (index % cols) * canvasWidth;
      const y = Math.floor(index / cols) * canvasHeight;
      ctx.drawImage(texture.image, x, y, canvasWidth, canvasHeight);

      // console.log('KEY_S', index, keys.components[index]);
      const text = keys.components[index].code || '';  // lấy code tương ứng hoặc chuỗi rỗng nếu không có
      ctx.fillText(text, x + 10, y + 30);
    }
  });

  // Xuất canvas tổng thành file ảnh
  combinedCanvas.toBlob((blob) => {
    if (!blob) {
      console.error('Lỗi khi tạo blob từ canvas tổng');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'combined_textures.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
};

// Ví dụ gọi hàm với mảng texture cần xuất
const exportAllTexturesCombined = async (KEYS) => {
  let texturesToCombine = [];
  for (const k of KEYS.components) {
    const mtls = k.cap.material;
    if (mtls[1]?.map) texturesToCombine.push(mtls[1].map);
    if (mtls[3]?.map) texturesToCombine.push(mtls[3].map);
  }
  // Đợi render canvas xong nếu canvas thay đổi động (nếu cần)
  await new Promise(r => setTimeout(r, 100));
  exportCombinedTexturesAsImage(texturesToCombine, KEYS, 'all_textures_combined.png');
};


