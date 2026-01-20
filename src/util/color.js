import initial_settings from "../config/settings_user_default.json";
import { updateCustomColorway } from "../store/slices/colorways";
import * as colorConvert from "color-convert";
import { subscribe } from "redux-subscriber";
import store from "../store/store";
import Util from "./math";

const accentOptions = [
  {
    background: "#49c5b1",
    foreground: "#eeeeee",
  },
  {
    background: "#5eaeff",
    foreground: "#ff26ff",
  },
  {
    background: "#e3229f",
    foreground: "#ffe600",
  },
  {
    background: "#81b595",
    foreground: "#094a21",
  },
  {
    background: "#c78bd6",
    foreground: "#0590a6",
  },
];

subscribe("colorways.active", (state) => {
  ColorUtil.cachedColorway = ColorUtil.getColorway(state.colorways.active);
});
subscribe("colorways.custom", (state) => {
  ColorUtil.cachedColorway = ColorUtil.getColorway(state.colorways.active);
});

//helpers for managing color values and colorway json
export default class ColorUtil {
  static cachedColorway;

  static getAllColorways() {
    return store.getState().colorways.available || [];
  }

  static get colorway() {
    const state = store.getState();
    const activeId = state.colorways?.active || null;
    
    // 🔒 Ưu tiên: current > custom > available.data > template
    const current = state.colorways?.current;
    if (current) return current;
    
    const custom = state.colorways?.custom || [];
    const foundCustom = custom.find(c => c.id === activeId);
    if (foundCustom) return foundCustom;
    
    const available = state.colorways?.available || [];
    const foundAvailable = available.find(c => c.id === activeId);
    if (foundAvailable) return foundAvailable;  // ✅ Backend data
    
    return initial_settings.colorways || null;
  }



  static get changedOverrides() {
    return this.changedOverridesArr.length > 0
      ? this.changedOverridesArr.length
      : [];
  }

  static getUserColorway(id) {
    let state = store.getState();
    id = id || state.colorways.active;
    return state.colorways.custom.find((c) => c.id === id);
  }

  static getColorway(cw_name) {
    cw_name = cw_name || store.getState().colorways.active;
    
    // 1️⃣ TÌM TRONG available (backend data)
    const available = store.getState().colorways.available || [];
    let cw = available.find(c => c.id === cw_name);
    if (cw) return cw;  // Backend data FULL swatches + override
    
    // 2️⃣ TÌM TRONG custom
    const custom = store.getState().colorways.custom || [];
    cw = custom.find(c => c.id === cw_name);
    if (cw) return cw;
    
    // 3️⃣ Fallback template
    return ColorUtil.getColorwayTemplate();
  }


  static getAccent(cw_name) {
    cw_name = cw_name || store.getState().colorways.active;
    return this.colorway?.swatches?.accent?.background || "";
  }

  static getUiAccent(cw_name, defaultAccent) {
    defaultAccent = defaultAccent || "#666666";
    let accent = this.getAccent(cw_name);
    if (!accent) return defaultAccent;
    let hsv = colorConvert.hex.hsv(accent);
    let ratio = this.contrast(accent, "202024");
    //too dark
    if (ratio < 7) {
      let ratioDelta = 7 - ratio;
      hsv[2] = Math.min(hsv[2] + 10 * ratioDelta, 100);
      let hex = `#${colorConvert.hsv.hex(hsv)}`;
      return hex;
    }
    return accent;
  }

  static addCodeToOverride(key_code, swatch) {
    swatch = swatch || store.getState().colorways.activeSwatch;
    const base = this.getUserColorway() || this.getColorway();
    if (!base || typeof base !== "object" || !swatch) return;
    let cw;
    try {
      cw = JSON.parse(JSON.stringify(base));
    } catch (e) {
      return;
    }
    cw.override = cw.override || {};
    cw.override[key_code] = swatch;
    store.dispatch(updateCustomColorway(cw));
  }

  static luminanace(r, g, b) {
    let a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  static contrast(hex1, hex2) {
    let rgb1 = colorConvert.hex.rgb(hex1);
    let rgb2 = colorConvert.hex.rgb(hex2);
    let lum1 = this.luminanace(rgb1[0], rgb1[1], rgb1[2]);
    let lum2 = this.luminanace(rgb2[0], rgb2[1], rgb2[2]);
    let brightest = Math.max(lum1, lum2);
    let darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  static getUiCompliment(cw_name) {
    let cw = this.getColorway(cw_name);
    return cw?.swatches?.accent?.color || "";
  }

  static getUiAccentText(cw_name) {
    let acc = this.getUiAccent(cw_name);
    let v = colorConvert.hex.hsv(acc);
    let isLight = (v[2] > 80 && v[1] < 50) || v[2] > 95;
    return isLight ? "black" : "white";
  }

  // static getRandomAccent() {
  //   return accentOptions[Math.floor(Math.random() * accentOptions.length)];
  // }

  static getRandomAccent() {
    const option = accentOptions[Math.floor(Math.random() * accentOptions.length)];
    return {
      background: option.background,
      foreground: option.foreground  // ✅ Return foreground thay vì color
    };
  }


  static getCaseColor(cw_name) {
    let cw = this.getColorway(cw_name);
    return cw?.case?.color || initial_settings.case.primaryColor;
  }

  static getColorwayTemplate(i) {
    const index = Number.isFinite(i) ? i : 1;
    let cw = {
      id: "",
      label: "",
      manufacturer: "",
      swatches: {
        base: { background: "#ffffff", foreground: "#000000" },
        mods: { background: "#eeeeee", foreground: "#000000" },
        accent: { background: "#cccccc", foreground: "#000000" },
      },
      override: {},
    };
    cw.swatches.accent = ColorUtil.getRandomAccent();
    cw.id = `cw_${Util.randString()}`;
    cw.label = `My Colorway ${index}`;
    return cw;
  }

  static getTransparentColor(hex, transparency) {
    let val = colorConvert.hex.rgb(hex);
    return `rgba(${val[0]}, ${val[1]}, ${val[2]}, ${transparency || 0.5})`;
  }

  static parseColor(color) {
    if (typeof color === "string" || color instanceof String) {
      color = color.replace("#", "");
      color = color.replace("0x", "");
    }
    return parseInt(color, 16);
  }

  //true if closer to white, false if closer to black
  static isLight(color) {
    color = this.parseColor(color);
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = (color >> 0) & 0xff;
    let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
  }
  //if color is dark make it brighter by ammout, darken if color is light
  static offsetColor(color, amount) {
    if (this.isLight(color)) {
      amount = amount * -1;
    }
    color = this.parseColor(color);
    var r = (color >> 16) + amount;
    var b = ((color >> 8) & 0x00ff) + amount;
    var g = (color & 0x0000ff) + amount;
    var newColor = g | (b << 8) | (r << 16);
    return "#" + newColor.toString(16);
  }

  static isValidColorString(str) {
    const reg = /^#[0-9A-F]{6}$/i;
    return reg.test(str);
  }
}
