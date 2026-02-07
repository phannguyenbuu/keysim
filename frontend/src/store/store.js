import { configureStore } from "@reduxjs/toolkit";
import { saveState } from "./localStorage";
import initSubscriber from "redux-subscriber";
import settingsReducer from "./slices/settings";
import switchesReducer from "./slices/switches";
import colorwaysReducer from "./slices/colorways";
import caseReducer from "./slices/case";
import keysReducer from "./slices/keys";
import renderSettingsReducer from "./slices/renderSettings";
import { initial_settings } from "./startup";

const ENABLE_LOCAL_STORAGE = true;

const store = configureStore({
  reducer: {
    keys: keysReducer,
    case: caseReducer,
    settings: settingsReducer,
    switches: switchesReducer,
    colorways: colorwaysReducer,
    renderSettings: renderSettingsReducer,
  },
  preloadedState: initial_settings,
});

if (ENABLE_LOCAL_STORAGE) {
  store.subscribe(() => {
    let state = store.getState();
    saveState({
      colorways: {
        byId: state.colorways.byId,
        order: state.colorways.order,
        activeId: state.colorways.activeId,
        activeSwatch: state.colorways.activeSwatch,
      },
    });
  });
}

initSubscriber(store);

export default store;
