import initial_settings from "../config/settings_user_default.json";
import { updateCustomColorway } from "../store/slices/colorways";
import * as colorConvert from "color-convert";
import { subscribe } from "redux-subscriber";
import store from "../store/store";
import Util from "./math";
import { getRandomAccent, contrast } from "./colorHelpers";

subscribe("colorways.activeId", (state) => {
  ColorUtil.cachedColorway = ColorUtil.getColorway(state.colorways.activeId);
});
subscribe("colorways.byId", (state) => {
  ColorUtil.cachedColorway = ColorUtil.getColorway(state.colorways.activeId);
});

export default class ColorUtil {
  static cachedColorway;

  static getAllColorways() {
    const state = store.getState();
    const order = state.colorways?.order || [];
    const byId = state.colorways?.byId || {};
    return order.map((id) => byId[id]).filter(Boolean);
  }

  static get colorway() {
    const state = store.getState();
    const activeId = state.colorways?.activeId || null;
    const byId = state.colorways?.byId || {};
    if (activeId && byId[activeId]) return byId[activeId];
    return ColorUtil.getColorwayTemplate();
  }

  static get changedOverrides() {
    return this.changedOverridesArr.length > 0
      ? this.changedOverridesArr.length
      : [];
  }

  static getUserColorway(id) {
    let state = store.getState();
    id = id || state.colorways.activeId;
    return state.colorways.byId?.[id];
  }

  static getColorway(cw_name) {
    const state = store.getState();
    cw_name = cw_name || state.colorways.activeId;
    const byId = state.colorways.byId || {};
    if (cw_name && byId[cw_name]) return byId[cw_name];
    return ColorUtil.getColorwayTemplate();
  }

  static getAccent(cw_name) {
    cw_name = cw_name || store.getState().colorways.activeId;
    return this.getColorway(cw_name)?.swatches?.accent?.background || "";
  }

  static getUiAccent(cw_name, defaultAccent) {
    defaultAccent = defaultAccent || "#666666";
    let accent = this.getAccent(cw_name);
    if (!accent) return defaultAccent;
    let hsv = colorConvert.hex.hsv(accent);
    let ratio = contrast(accent, "202024", colorConvert);
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
    cw.swatches.accent = getRandomAccent();
    cw.id = `cw_${Util.randString()}`;
    cw.label = `My Colorway ${index}`;
    return cw;
  }
}
