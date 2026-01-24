import * as THREE from "three";
import { subscribe } from "redux-subscriber";
import { initial_settings } from "../../store/startup";
import LAYOUTS from "../../config/layouts/layouts";
import Util from "../../util/math";
import case_1 from "./case_1";
import case_2 from "./case_2";
import badge from "./badge";
import ColorUtil from "../../util/color";
import { lightTexture } from "./lightTexture";

import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import shadowPath from "../../assets/dist/shadow-key-noise.png";
import noisePath from "../../assets/dist/noise.png";
import brushedRoughness from "../../assets/dist/brushed-metal_roughness-512.png";
import brushedAlbedo from "../../assets/dist/brushed-metal_albedo-512.png";
import brushedAo from "../../assets/dist/brushed-metal_ao-512.png";

import shadow_path_100 from "../../assets/shadows/100.png";
import shadow_path_40 from "../../assets/shadows/40.png";
import shadow_path_60 from "../../assets/shadows/60.png";
import shadow_path_60hhkb from "../../assets/shadows/60hhkb.png";
import shadow_path_60iso from "../../assets/shadows/60iso.png";
import shadow_path_60wkl from "../../assets/shadows/60wkl.png";
import shadow_path_65 from "../../assets/shadows/65.png";
import shadow_path_75 from "../../assets/shadows/75.png";
import shadow_path_80 from "../../assets/shadows/80.png";
import shadow_path_95 from "../../assets/shadows/95.png";
import shadow_path_leftnum from "../../assets/shadows/leftnum.png";
import shadow_path_numpad from "../../assets/shadows/numpad.png";
import shadow_path_40ortho from "../../assets/shadows/40ortho.png";
import shadow_path_50ortho from "../../assets/shadows/50ortho.png";

import nx from "../../assets/dist/nx.jpg";
import ny from "../../assets/dist/ny.jpg";
import nz from "../../assets/dist/nz.jpg";
import px from "../../assets/dist/px.jpg";
import py from "../../assets/dist/py.jpg";
import pz from "../../assets/dist/pz.jpg";

const shadow_paths = {
  shadow_path_100,
  shadow_path_40,
  shadow_path_60,
  shadow_path_60hhkb,
  shadow_path_60iso,
  shadow_path_60wkl,
  shadow_path_65,
  shadow_path_75,
  shadow_path_80,
  shadow_path_95,
  shadow_path_leftnum,
  shadow_path_numpad,
  shadow_path_40ortho,
  shadow_path_50ortho,
};

const MATERIAL_OPTIONS = {
  matte: {
    metalness: 0,
    roughness: 1,
    clearcoat: 0,
    aoMapIntensity: 0.1,
    clearcoatRoughness: 1,
    lightMapIntensity: 0.2,
  },
  brushed: {
    metalness: 0.4,
    aoMapIntensity: 0.4,
    envMapIntensity: 1,
  },
  glossy: {
    metalness: 0.8,
    roughness: 0.1,
    aoMapIntensity: 0.4,
    envMapIntensity: 1,
  },
};

// Manage the parts of the board: case, keys.
// dispatch updates and determine when they should be reinitialized
export default class CaseManager {
  constructor(opts) {
    this.scene = opts.scene;
    this.keys = opts.keys;
    this.layoutName = initial_settings.case.layout;
    this.style = initial_settings.case.style;
    this.color = initial_settings.case.primaryColor;
    this.finish = initial_settings.case.material;
    this.layout = LAYOUTS[this.layoutName];
    this.texScale = 0.1;
    this.bezel = 0.5;
    this.height = 1;
    this.angle = 0;
    this.r = 0.5;
    this.setup();
  }

  get width() {
    return this.layout.width + this.bezel * 2;
  }
  get depth() {
    return this.layout.height + this.bezel * 2;
  }
  get angleOffset() {
    return Math.sin(Util.toRad(this.angle)) * this.depth;
  }

  setup() {
    this.group = new THREE.Group();
    this.group.name = "CASE";
    this.loader = new TextureLoader();
    this.loadTextures();
    this.createEnvCubeMap();
    // this.createBadge();
    // this.createPlate();
    this.createCase();

    //case global position (shadow is out side this.group)
    this.position();
    this.scene.add(this.group);

    subscribe("case.primaryColor", (state) => {
      this.color = state.case.primaryColor;
      this.updateCaseMaterial();
    });

    subscribe("case.material", (state) => {
      this.finish = state.case.material;
      this.updateCaseMaterial();
    });

    subscribe("case.style", (state) => {
      this.layout = LAYOUTS[state.case.layout];
      this.style = state.case.style;
      this.updateCaseGeometry();
    });

    subscribe("case.layout", (state) => {
      this.layoutName = state.case.layout;
      this.layout = LAYOUTS[state.case.layout];
      this.updateCaseGeometry();
      this.createBadge();
      this.createPlate();
    });

    // subscribe("colorways.active", () => {
    //   this.updateLightMap();
    // });
  }

  position() {
    this.group.rotation.x = Util.toRad(this.angle);
    this.group.position.x = -this.layout.width / 2;
    this.group.position.y = this.angleOffset + this.height;
  }

  loadTextures() {
    this.aoNoiseTexture = this.loader.load(noisePath);
    this.aoNoiseTexture.wrapS = THREE.RepeatWrapping;
    this.aoNoiseTexture.wrapT = THREE.RepeatWrapping;

    this.aoShadowTexture = this.loader.load(shadowPath);
    this.aoShadowTexture.wrapS = THREE.RepeatWrapping;
    this.aoShadowTexture.wrapT = THREE.RepeatWrapping;

    this.roughnessMap = this.loader.load(brushedRoughness);
    this.roughnessMap.wrapS = THREE.RepeatWrapping;
    this.roughnessMap.wrapT = THREE.RepeatWrapping;
    this.roughnessMap.repeat.x = this.texScale;
    this.roughnessMap.repeat.y = this.texScale;
    this.roughnessMap.rotation = Math.PI / 2;

    this.albedoMap = this.loader.load(brushedAlbedo);
    this.albedoMap.wrapS = THREE.RepeatWrapping;
    this.albedoMap.wrapT = THREE.RepeatWrapping;
    this.albedoMap.repeat.x = this.texScale;
    this.albedoMap.repeat.y = this.texScale;
    this.albedoMap.rotation = Math.PI / 2;

    this.ao = this.loader.load(brushedAo);
    this.ao.wrapS = THREE.RepeatWrapping;
    this.ao.wrapT = THREE.RepeatWrapping;
    this.ao.repeat.x = this.texScale;
    this.ao.repeat.y = this.texScale;
    this.ao.rotation = Math.PI / 2;

    this.lightTexture = lightTexture(ColorUtil.getAccent());
  }

  createPlate() {
    if (this.plate) this.group.remove(this.plate);
    let geometry_plate = new THREE.PlaneGeometry(
      this.width - this.bezel * 2,
      this.depth - this.bezel * 2
    );
    let material_plate = new THREE.MeshLambertMaterial({
      color: "black",
    });
    this.plate = new THREE.Mesh(geometry_plate, material_plate);
    this.plate.rotateX(-Math.PI / 2);
    this.plate.name = "IGNORE";
    this.plate.layers.enable(1);
    this.plate.position.set(
      this.width / 2 - this.bezel,
      -0.5,
      this.depth / 2 - this.bezel
    );
    this.group.add(this.plate);
  }

  createBadge() {
    if (this.badgeMesh) this.group.remove(this.badgeMesh);
    if (this.layout.width > 18) {
      let w = this.layout.width;
      let bw = 3;
      bw = w > 19 ? 4 : bw;
      bw = w > 21 ? 4 : bw;
      let bx = 15.25;
      bx = w > 19 ? 15.5 : bx;
      bx = w > 21 ? 18.5 : bx;
      this.badgeMesh = badge(bw, this.cubemap);
      this.badgeMesh.position.x += bx;
      this.group.add(this.badgeMesh);
    }
  }

  createEnvCubeMap() {
    this.cubemap = new THREE.CubeTextureLoader().load([py, ny, pz, nz, px, nx]);
  }

  getCaseBounds() {
    if (!this.group) return null;
    const bounds = new THREE.Box3();
    let hasMesh = false;
    this.group.updateMatrixWorld(true);
    this.group.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      if (obj.name && obj.name.startsWith("KC_")) return;
      obj.updateWorldMatrix(true, false);
      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      const box = obj.geometry.boundingBox.clone();
      box.applyMatrix4(obj.matrixWorld);
      bounds.union(box);
      hasMesh = true;
    });
    if (!hasMesh) return null;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    return { size, center };
  }

  createCaseShadow(bounds = this.getCaseBounds()) {
    if (!bounds) return;
    if (this.shadow) this.scene.remove(this.shadow);
    const sh_o = this.style === "CASE_1" ? 0 : -0.05;
    const shadowScale = this.style === "CASE_1" ? 1.8 : 1.2;
    const padding = this.bezel * 2;
    const sh_w = bounds.size.x * shadowScale + padding;
    const sh_h = bounds.size.z * shadowScale * 2.5 + padding;
    let shadowTex = this.loader.load(
      shadow_paths[`shadow_path_${this.layoutName}`]
    );
    shadowTex.minFilter = THREE.LinearFilter;
    shadowTex.magFilter = THREE.LinearFilter;
    let shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(sh_w, sh_h),
      shadowMat
    );
    this.shadow.position.x = bounds.center.x;
    this.shadow.position.z = bounds.center.z + sh_o;
    this.shadow.position.y = 0.6;
    this.shadow.material.side = THREE.DoubleSide;
    this.shadow.rotateX(-Math.PI/2);
    this.shadow.rotateY(0);
    this.scene.add(this.shadow);
  }

  getCaseMesh(layout = this.layout, style = this.style) {
    let mesh;
    console.log("Style",style);
    if (style === "CASE_1") {
      mesh = case_1(layout, this.color);
    } else {
      // mesh = case_2(layout, this.color);
    }
    return mesh;
  }

  async createCase() {
    // this.case = this.getCaseMesh();
    const caseData = await case_1(this.layout, this.color, this.layoutName);
    // this.updateCaseMaterial();
    this.case = caseData.mesh;
    this.group.add(this.case);
    this.group.updateMatrixWorld(true);
    // this.escPos = caseData.escPosition;
    this.keyPositions = caseData.keyPositions;

    this.keySet = caseData.keySet;

    const validKeys = this.keySet instanceof Set
    ? this.keySet
    : new Set(this.keySet);

    // console.log("Keys", validKeys, this.keys.components.length);

    this.keys.components.forEach(obj => {
      if(!validKeys.has(obj.code))
        obj.cap.visible = false;
    })
    
    Object.entries(this.keyPositions).forEach(([code, pos]) => {
      const key = this.keys.getKey(code);
      if (key) {
        key.cap.position.copy(pos);
      }
    });

    this.updateCaseMaterial();
    this.createCaseShadow();
  }

  updateCaseGeometry() {
    let mesh = this.getCaseMesh();
    this.case.geometry = mesh.geometry;
    this.case.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    this.position();
    this.group.updateMatrixWorld(true);
    this.createCaseShadow();
  }

  // updateLightMap() {
  //   this.lightTexture = lightTexture(ColorUtil.getAccent());
  //   this.case.material[1].lightMap = this.lightTexture;
  // }

  updateCaseMaterial(color = this.color, finish = this.finish) {
    if (!this.case) return;
    const glossyWhite = new THREE.MeshPhysicalMaterial({
      color: "#eeeeee",
      metalness: 0.15,
      roughness: 0.08,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      envMap: this.cubemap,
      envMapIntensity: 1.1,
    });

    this.case.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = glossyWhite;
        obj.material.needsUpdate = true;
      }
    });
  }
}
