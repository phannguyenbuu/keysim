import { get_qs_values } from "./qs";
import { loadState } from "./localStorage";
import settings from "../config/settings_user_default.json";

const starting_colorway_options = [
  "cafe",
  "mecha",
  "lunar",
  "jamon",
  "bento",
  "olivia",
  "striker",
  "bushido",
  "oblivion",
  "nautilus",
  "vilebloom",
  "handarbeit",
  "hammerhead",
  "modern_dolch",
  "blue_samurai",
  "red_samurai",
];

const starting_layout_options = ["75"];

let randomItem = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const getInitialState = () => {
  let qs = get_qs_values();
  let saved_colorways = loadState();
  let initial = settings;
  const baseColorways = {
    byId: {},
    order: [],
    activeId: initial.colorways.active || null,
    activeSwatch: initial.colorways.activeSwatch || "accent",
    editing: initial.colorways.editing || false,
  };
  const addColorway = (cw) => {
    if (!cw || !cw.id) return;
    baseColorways.byId[cw.id] = cw;
    if (!baseColorways.order.includes(cw.id)) {
      baseColorways.order.push(cw.id);
    }
  };
  if (saved_colorways?.colorways?.byId) {
    Object.values(saved_colorways.colorways.byId).forEach(addColorway);
    baseColorways.activeId =
      saved_colorways.colorways.activeId || baseColorways.activeId;
    baseColorways.activeSwatch =
      saved_colorways.colorways.activeSwatch || baseColorways.activeSwatch;
  } else if (saved_colorways?.settings) {
    saved_colorways.settings.forEach(addColorway);
    if (saved_colorways.active) {
      baseColorways.activeId = saved_colorways.active;
    }
  }

  //set random initial values
  if (!qs) {
    baseColorways.activeId = randomItem(starting_colorway_options);
    initial.case.layout = randomItem(starting_layout_options);
    initial.keys.legendSecondaryStyle = "";
  }

  if (qs && qs["debug"]) {
    initial.settings.debug = true;
  }
  //set initial values if in query string
  if (qs && qs["size"]) {
    initial.case.layout = qs["size"];
  }
  if (qs && qs["colorway"]) {
    if (typeof qs["colorway"] === "object") {
      addColorway(qs["colorway"]);
      baseColorways.activeId = qs["colorway"].id;
    } else {
      baseColorways.activeId = qs["colorway"];
    }
  }
  if (qs && qs["legend"]) {
    initial.keys.legendPrimaryStyle = qs["legend"];
  }
  if (qs && qs["sub"]) {
    initial.keys.legendSecondaryStyle = "";
  }
  if (qs && qs["cc"]) {
    initial.case.primaryColor = `#${qs["cc"]}`;
    initial.case.autoColor = false;
  }
  if (qs && qs["cf"]) {
    initial.case.material = qs["cf"];
  }

  let accent = "";
  if (qs && typeof qs["colorway"] === "object") {
    accent = qs["colorway"].swatches.accent.background;
  } else {
    accent = "#ffffff";
      // COLORWAYS[initial?.colorways?.active]?.swatches?.accent?.background;
  }
  initial.settings.sceneColor = accent;
  initial.colorways = baseColorways;
  return initial;
};

export const initial_settings = getInitialState();
