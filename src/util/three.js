import * as THREE from "three";
import QRCode from "qrcode-generator";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";

export default class ThreeUtil {
  //get place with texture applied
  static getTexturedPlane(tex) {
    let loader = new TextureLoader();
    let texture = loader.load(tex);
    let material = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      map: texture,
      transparent: true,
    });
    let plane = new THREE.Mesh(new THREE.PlaneGeometry(130, 50), material);
    plane.material.side = THREE.DoubleSide;
    return plane;
  }
  //merge geometries of meshes
  // static mergeMeshes(meshes) {
  //   let material = meshes[0].material;
  //   let combined = new THREE.Geometry();
  //   for (var i = 0; i < meshes.length; i++) {
  //     meshes[i].updateMatrix();
  //     combined.merge(meshes[i].geometry, meshes[i].matrix);
  //   }
  //   let mesh = new THREE.Mesh(combined, material);
  //   mesh.receiveShadow = meshes[i].receiveShadow;
  //   mesh.castShadow = meshes[i].castShadow;
  //   return mesh;
  // }
  //create a box mesh with a geometry and material
  static createBox(w, h, l, x, y, z, color) {
    var material = new THREE.MeshLambertMaterial({
      color: color || "#666666",
      fog: false,
    });
    var geom = new THREE.BoxGeometry(w || 10, h || 10, l || 10);
    var mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    return mesh;
  }
  //creater box from object
  static createBoxOpts(options) {
    return this.createBox(
      options.w,
      options.h,
      options.l,
      options.x,
      options.y,
      options.z,
      options.color
    );
  }

  static async getSceneScreenshot(renderer, qrData) {
    const data = renderer.domElement.toDataURL("image/png");
    const baseImg = await this.loadImage(data);
    const canvas = document.createElement("canvas");
    canvas.width = baseImg.width;
    canvas.height = baseImg.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrapper = document.getElementById("canvas-wrapper");
    const bgColor = wrapper
      ? getComputedStyle(wrapper).backgroundColor
      : null;
    if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const clearColor = new THREE.Color();
      renderer.getClearColor(clearColor);
      const clearAlpha = renderer.getClearAlpha();
      const r = Math.round(clearColor.r * 255);
      const g = Math.round(clearColor.g * 255);
      const b = Math.round(clearColor.b * 255);
      const a = clearAlpha > 0 ? clearAlpha : 1;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(baseImg, 0, 0);

    if (qrData) {
      try {
        const qrCanvas = this.createQrCanvas(qrData, 256);
        if (qrCanvas) {
          ctx.drawImage(qrCanvas, 16, 16, 256, 256);
        }
      } catch (error) {
        console.error("QR render failed", error);
      }
    }

    const output = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = output;
    link.download = "keysim-screenshot.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  static createQrCanvas(data, size) {
    const qr = QRCode(0, "M");
    qr.addData(data);
    qr.make();
    const count = qr.getModuleCount();
    const margin = 4;
    const cell = size / (count + margin * 2);
    const radius = cell * 0.45;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#111111";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (!qr.isDark(row, col)) continue;
        const x = (col + margin + 0.5) * cell;
        const y = (row + margin + 0.5) * cell;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return canvas;
  }
}
