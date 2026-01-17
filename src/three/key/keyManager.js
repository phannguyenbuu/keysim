import * as THREE from "three";
import Util from "../../util/math";
import KeyUtil from "../../util/keyboard";
import ColorUtil from "../../util/color";
import KEYMAPS from "../../config/keymaps/keymaps";
import LAYOUTS from "../../config/layouts/layouts";
import { subscribe } from "redux-subscriber";
import { initial_settings } from "../../store/startup";
import { Key, KEYSTATES } from "./key";
import Collection from "../collection";

export default class KeyManager extends Collection {
  constructor(opts) {
    super(opts);
    this.height = 1.1;
    this.angle = 6;
    this.setup();
  }

  setup() {
    this.group = new THREE.Object3D();
    this.group.name = "KEYS";
    this.editing = false;
    this.paintWithKeys = false;
    this.getLayout();
    this.getKeymap();
    this.createKeys();
    this.bindPressedEvents();
    this.bindPaintEvent();
    this.position();
    this.scene.add(this.group);

    subscribe("case.layout", (state) => {
      this.getLayout(state.case.layout);
      this.getKeymap(state.case.layout);
      this.createKeys();
      this.position();
    });
    subscribe("colorways.editing", (state) => {
      this.editing = state.colorways.editing;
    });
    subscribe("settings.paintWithKeys", (state) => {
      this.paintWithKeys = state.settings.paintWithKeys;
    });
  }

  get width() {
    return this.layoutFull.width;
  }
  get depth() {
    return this.layoutFull.height;
  }
  get angleOffset() {
    return Math.sin(Util.toRad(this.angle)) * this.depth;
  }

  position() {
    this.group.rotation.x = Util.toRad(this.angle);
    this.group.position.x = -this.layoutFull.width / 2;
    this.group.position.y = this.angleOffset + this.height;
  }

  getKeymap(id = initial_settings.case.layout) {
    // this.keymap = KEYMAPS[id].layers[0];
    this.keymap = KEYMAPS['75'].layers[0];
  }

  getLayout(id = initial_settings.case.layout) {
    this.layoutFull = LAYOUTS[id];
    this.layout = LAYOUTS[id].layouts["LAYOUT"].layout;
  }

  // bindPressedEvents() {
  //   document.addEventListener("keydown", (e) => {
  //     let code = KeyUtil.getKeyCode(e.code);
  //     let key = this.getKey(code);
  //     if (!key) return;
  //     if (this.editing && this.paintWithKeys) {
  //       this.paintKey(code);
  //     }
  //     key.setState(KEYSTATES.MOVING_DOWN);
  //   });
  //   document.addEventListener("keyup", (e) => {
  //     let code = KeyUtil.getKeyCode(e.code);
  //     let key = this.getKey(code);
  //     if (!key) return;
  //     key.setState(KEYSTATES.MOVING_UP);
  //   });
  // }

  bindPressedEvents() {
    // ✅ FIX: preventDefault cho special keys
    document.addEventListener("keydown", (e) => {
      // Block browser shortcuts
      if (['Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 
          'Meta', 'OS', 'Fn'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      let code = KeyUtil.getKeyCode(e.code) || e.code || e.key; // ✅ Fallback
      let key = this.getKey(code);
      
      if (!key) {
        console.log("Key not found:", code, e.code, e.key); // Debug
        return;
      }
      
      if (this.editing && this.paintWithKeys) {
        this.paintKey(code);
      }
      key.setState(KEYSTATES.MOVING_DOWN);
    });

    document.addEventListener("keyup", (e) => {
      let code = KeyUtil.getKeyCode(e.code) || e.code || e.key;
      let key = this.getKey(code);
      if (!key) return;
      key.setState(KEYSTATES.MOVING_UP);
    });
  }


  bindPaintEvent() {
    document.addEventListener("key_painted", (e) => {
      this.paintKey(e.detail);
    });
  }

  paintKey(code) {
    ColorUtil.addCodeToOverride(code);
    this.getKey(code).updateColors();
  }

  removeKey(key) {
    key.destroy();
    this.remove(key);
  }

  removeAllOldKeys() {
    this.components = this.components.filter((x) => {
      let keep = this.keymap.includes(x.code);
      if (!keep) x.destroy();
      return keep;
    });
  }

  // createKeys() {
  //   let seen = []; //for boards with multiple keys of same code
  //   this.removeAllOldKeys();
  //   console.log('🔑 KeyManager createKeys layout:', this.layout.length);

  //   for (let i = 0; i < this.layout.length; i++) {
  //     let code = this.keymap[i];
  //     let dimensions = this.layout[i];
  //     dimensions.row = KeyUtil.getKeyProfile(
  //       i,
  //       this.layout,
  //       this.layoutFull.height
  //     );
  //     let existingKey = this.getKey(code);
  //     if (existingKey && !seen.includes(code)) {
  //       if (this.matchesSize(existingKey, dimensions)) {
  //         existingKey.move(dimensions);
  //         seen.push(code);
  //         continue;
  //       }
  //       this.removeKey(existingKey);
  //     }
  //     let K = new Key({
  //       dimensions: dimensions,
  //       container: this.group,
  //       isIso: this.layoutFull?.is_iso,
  //       colorway: this.colorway,
  //       code: code,
  //     });
  //     this.add(K);
  //     seen.push(code);
  //   }
  // }

  createKeys() {
  let seen = [];
  this.removeAllOldKeys();
  
  for (let i = 0; i < this.layout.length; i++) {
    // ✅ PRIORITY: layout.code > keymap
    let code = this.layout[i].code || this.keymap[i] || 'BLANK';
    
    let dimensions = this.layout[i];
    dimensions.row = KeyUtil.getKeyProfile(i, this.layout, this.layoutFull.height);
    
    // 🔥 LEGEND cho Win/Fn = "sa" text
    let legend = 'cherry';
    if (code.includes('GUI')) {
      legend = 'sa';  // Text "Win"/"Fn"/"HOME"
    }
    
    let existingKey = this.getKey(code);
    if (existingKey && !seen.includes(code)) {
      if (this.matchesSize(existingKey, dimensions)) {
        existingKey.move(dimensions);
        seen.push(code);
        continue;
      }
      this.removeKey(existingKey);
    }
    
    let K = new Key({
      dimensions: dimensions,
      container: this.group,
      isIso: this.layoutFull?.is_iso,
      colorway: this.colorway,
      code: code,
      legend: legend  // ← THÊM NÀY!
    });
    this.add(K);
    seen.push(code);
  }
}


  getKey(code) {
    let k = this.components.find((x) => x.code === code);
    return k;
  }

  matchesSize(k, dimensions) {
    let hmatch = (k.options.dimensions?.h || 1) === (dimensions?.h || 1);
    let wmatch = (k.options.dimensions?.w || 1) === (dimensions?.w || 1);
    return hmatch && wmatch;
  }
}
