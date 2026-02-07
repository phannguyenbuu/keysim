import * as THREE from "three";
import Util from "../../util/math";
import KeyUtil from "../../util/keyboard";
import ColorUtil from "../../util/color";
import KEYMAPS from "../../config/keymaps/keymaps";
import LAYOUTS from "../../config/layouts/layouts";
import qmkCodes from "../../config/keys/qmk_codes.json";
import { subscribe } from "redux-subscriber";
import { initial_settings } from "../../store/startup";
import { Key, KEYSTATES } from "./key";
import { enableHighlight, disableHighlight } from "./materials";
import Collection from "../collection";
import { keyGeometry, keyGeometryISOEnter } from "./geometry";
import layout75Default from "../../config/layouts/layout_75_default.json";

export default class KeyManager extends Collection {
  constructor(opts) {
    super(opts);
    this.caseManager = opts.caseManager;
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

//     console.log("0 KEY COUNT:", this.components.length);
// console.log("0 KEYS GROUP CHILDREN:", this.group.children.length);

    this.bindPressedEvents();
    this.bindPaintEvent();
    this.bindTypingHighlight();
    this.position();
    this.scene.add(this.group);

    if (this.caseManager) {
      this.applyProfileFromPositions(this.caseManager.keyPositions);
    }

    subscribe("case.layout", (state) => {
      this.getLayout(state.case.layout);
      this.getKeymap(state.case.layout);
      this.createKeys();
//       console.log("1 KEY COUNT:", this.components.length);
// console.log("1 KEYS GROUP CHILDREN:", this.group.children.length);


      if (this.caseManager) {
        this.applyProfileFromPositions(this.caseManager.keyPositions);
      }
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

  // getLayout(id = initial_settings.case.layout) {
  //   this.layoutFull = LAYOUTS[id];
  //   this.layout = LAYOUTS[id].layouts["LAYOUT"].layout;
  // }

  getLayout(id = initial_settings.case.layout) {
    this.layoutFull = LAYOUTS[id];

    // 1) base absolute layout (x/y đầy đủ)
    const base = layout75Default.layouts.LAYOUT.layout; // mảng 83 item có x/y

    // 2) overrides minimal (chỉ có i,w,...)
    const overrides = this.layoutFull.layouts.LAYOUT.layout; // mảng sparse [{i:29,w:2},...]

    // 3) merge -> resolved layout dùng để createKeys
    this.layout = this.mergeLayoutBaseWithOverrides(base, overrides);

    console.log("RESOLVED LAYOUT SAMPLE:", this.layout.slice(0,10));

  }


  mergeLayoutBaseWithOverrides(baseAbs, overridesSparse) {
    const out = baseAbs.map((it) => ({
      x: it.x ?? 0,
      y: it.y ?? 0,
      w: it.w ?? 1,
      h: it.h ?? 1,
      // nếu default json có các field khác thì copy luôn
      ...it,
    }));

    // overrides kiểu {i:29, w:2, ...}
    (overridesSparse || []).forEach((ov) => {
      if (!ov) return;
      const idx = Number.isInteger(ov.i) ? ov.i : Number.isInteger(ov.index) ? ov.index : -1;
      if (idx < 0 || idx >= out.length) return;

      const copy = { ...ov };
      delete copy.i;
      delete copy.index;

      out[idx] = { ...out[idx], ...copy };
    });

    return out;
  }


  normalizeLayout(layout, keyCount) {
    const defaultItem = { x: 0, y: 0, w: 1 };
    const base = Array.from({ length: keyCount }, () => ({ ...defaultItem }));
    if (!Array.isArray(layout)) return base;
    const looksLikeOverrides =
      layout.length !== keyCount ||
      layout.some((item) => item && (item.i !== undefined || item.index !== undefined));
    if (looksLikeOverrides) {
      layout.forEach((item, idx) => {
        if (!item) return;
        const targetIndex =
          Number.isInteger(item.i) ? item.i :
          Number.isInteger(item.index) ? item.index :
          idx;
        if (targetIndex < 0 || targetIndex >= base.length) return;
        base[targetIndex] = { ...base[targetIndex], ...item };
        delete base[targetIndex].i;
        delete base[targetIndex].index;
      });
      return base;
    }
    return layout.map((item) => ({ ...defaultItem, ...(item || {}) }));
  }

  bindPressedEvents() {
    const isEditableTarget = (target) => {
      if (!target) return false;
      if (target.closest && target.closest('[data-typing-input="true"]'))
        return true;
      const tag = (target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      return target.isContentEditable === true;
    };
    // ✅ FIX: preventDefault cho special keys
    document.addEventListener("keydown", (e) => {
      const resolvedCode = qmkCodes[e.code] || qmkCodes[e.key] || KeyUtil.getKeyCode(e.code) || KeyUtil.getKeyCode(e.key) || e.code || e.key;
      // Block browser shortcuts (skip when typing)
      if (!isEditableTarget(e.target) && ['Tab', 'Escape', 'Enter', ' ', 'Spacebar', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 
          'Meta', 'OS', 'Fn', 'Alt', 'AltGraph'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      let code = KeyUtil.getKeyCode(e.code) || e.code || e.key; // ✅ Fallback
      let key = this.getKey(resolvedCode);
      
      if (!key) {
        console.log("Key not found:", resolvedCode, e.code, e.key); // Debug
        return;
      }
      
      if (this.editing && this.paintWithKeys) {
        this.paintKey(resolvedCode);
      }
      key.setState(KEYSTATES.MOVING_DOWN);
    });

    document.addEventListener("keyup", (e) => {
      if (!isEditableTarget(e.target) && ['Alt', 'AltGraph'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      const resolvedCode = qmkCodes[e.code] || qmkCodes[e.key] || KeyUtil.getKeyCode(e.code) || KeyUtil.getKeyCode(e.key) || e.code || e.key;
      let code = KeyUtil.getKeyCode(e.code) || e.code || e.key;
      let key = this.getKey(resolvedCode);
      if (!key) return;
      key.setState(KEYSTATES.MOVING_UP);
    });
  }


  bindPaintEvent() {
    document.addEventListener("key_painted", (e) => {
      this.paintKey(e.detail);
    });
  }

  bindTypingHighlight() {
    document.addEventListener("typing_next_key", (e) => {
      const code = e.detail?.code;
      if (this.highlightedKey) {
        const prevKey = this.getKey(this.highlightedKey);
        if (prevKey && prevKey.cap) {
          disableHighlight(prevKey.cap);
        }
        this.highlightedKey = null;
      }
      if (!code) return;
      const nextKey = this.getKey(code);
      if (nextKey && nextKey.cap) {
        enableHighlight(nextKey.cap);
        this.highlightedKey = code;
      }
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
    this.layout = this.normalizeLayout(this.layout, this.keymap.length);
    
    for (let i = 0; i < this.layout.length; i++) {
      // ✅ PRIORITY: layout.code > keymap
      let code = this.layout[i].code || this.keymap[i] || 'BLANK';


      // ✅ debug: in index của phím Fn

      if (code.includes("PG")) {
        console.log("KEY INDEX OUT OF BOUNDS:", i, code);
      }

      
      let dimensions = this.layout[i];
      // dimensions.row = KeyUtil.getKeyProfile(i, this.layout, this.layoutFull.height);
      dimensions.row = this.mapYToCherryRow(dimensions.y);
      
      let existingKey = this.getKey(code);
      if (existingKey && !seen.includes(code)) {
        if (this.matchesSize(existingKey, dimensions)) {
          existingKey.move(dimensions);
          seen.push(code);
          continue;
        }
        this.removeKey(existingKey);
      }

      // if (i < 10) console.log("DIM", i, dimensions);

      
      let K = new Key({
        dimensions: dimensions,
        container: this.group,
        isIso: this.layoutFull?.is_iso,
        colorway: this.colorway,
        code: code
      });
      this.add(K);
      
      seen.push(code);

      if (i < 10) console.log("DIM", i, dimensions.x, dimensions.y, dimensions.w, dimensions.row);
    }


    
  }

  mapYToCherryRow(y) {
    // 75% thường 6 hàng: y=0..5
    // Cherry profile hay map kiểu: top -> R1, ... bottom -> R4
    // Bạn tùy chỉnh theo ý.
    if (y <= 1) return 1;   // hàng 0-1: R1
    if (y === 2) return 2;  // hàng 2:   R2
    if (y === 3) return 3;  // hàng 3:   R3
    return 4;               // hàng 4-5: R4
  }


  applyProfileFromPositions(keyPositions) {
    if (!keyPositions) return;

    const positions = Object.values(keyPositions);
    if (!positions.length) return;

    const epsilon = 0.0001;
    const zValues = [];

    positions.forEach((pos) => {
      if (!zValues.some((z) => Math.abs(z - pos.z) < epsilon)) {
        zValues.push(pos.z);
      }
    });

    zValues.sort((a, b) => a - b);

    if (!zValues.length) return;

    const mapRowToProfile = (rowIndex, totalRows) => {
      if (totalRows < 5) return rowIndex + 1;
      if (totalRows > 5) {
        let row = rowIndex === 0 ? 1 : rowIndex;
        return row > 4 ? 4 : row;
      }
      let row = rowIndex + 1;
      return row > 4 ? 4 : row;
    };

    const totalRows = zValues.length;

    this.components.forEach((key) => {
      const pos = keyPositions[key.code];
      if (!pos) return;

      const rowIndex = zValues.findIndex((z) => Math.abs(z - pos.z) < epsilon);

      if (rowIndex < 0) return;

      const profileRow = mapRowToProfile(rowIndex, totalRows);

      key.options.dimensions.row = profileRow;
      key.geometryOptions.row = profileRow;

      const geometry = key.is_iso_enter
        ? keyGeometryISOEnter(key.geometryOptions)
        : keyGeometry(key.geometryOptions);

      key.cap.geometry = geometry;
    });
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
