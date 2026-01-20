import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./Colorway.module.scss";
import {
  removeCustomColorway,
  setColorway,
} from "../../store/slices/colorways";
import * as settingsActions from "../../store/slices/settings";
import { selectColorway } from "../../store/slices/colorways";

export default function Colorway(props) {
  const dispatch = useDispatch();
  // console.log("All colors",  props.colorway?.swatches);
  const base_bg = props.colorway?.swatches?.base?.background || "#ffffff";
  const base_fg = props.colorway?.swatches?.base?.foreground || "#00ff00";
  const mods_bg = props.colorway?.swatches?.mods?.background || base_bg;
  const mods_fg = props.colorway?.swatches?.mods?.foreground || base_fg;
  const accent_bg = props.colorway?.swatches?.accent?.background || mods_bg;
  const accent_fg = props.colorway?.swatches?.accent?.foreground || mods_fg;
  const isActive = props.colorway.id === useSelector(selectColorway);

  // const applyColorway = () => {
  //   dispatch(setColorway(props.colorway.id));
  //   let c = accent_bg;
  //   if (c) {
  //     dispatch(settingsActions.setSceneColor(c));
  //   }
  // };

  const removeColorway = (e) => {
    dispatch(removeCustomColorway(props.colorway.id));
    e.stopPropagation();
  };

  const applyColorway = () => {
    dispatch(setColorway(props.colorway.id));
    const accent_bg = props.colorway?.swatches?.accent?.background;
    if (accent_bg) {
      dispatch(settingsActions.setSceneColor(accent_bg));
    }
  };

  // const removeColorway = (e) => {
  //   dispatch(removeCustomColorway(props.colorway.id));
  //   e.stopPropagation();
  // };

  const renderSwatches = () => {
    const swatches = props.colorway?.swatches || {};
    return Object.entries(swatches).map(([key, swatch]) => (
      <div
        key={key}
        className={styles.swatch}
        style={{
          background: swatch?.background || "#ffffff",
          color: swatch?.color || "#ff0000",
        }}
        title={`${key}: ${swatch?.background}`}
      >
        {/* Optional: hiển thị key hoặc icon */}
        {/* <span>{key.toUpperCase()}</span> */}
      </div>
    ));
  };

  return (
    <li
      className={styles.colorway}
      aria-label={"colorway " + props.colorway.label}
    >
      <button
        className={isActive ? styles.previewActive : styles.preview}
        onClick={applyColorway}
        tabIndex={isActive ? "" : "0"}
        aria-label={"Apply colorway " + props.colorway?.label}
      >
        <div className={styles.info}>
          <p className={styles.title}>
            {props.colorway?.label || "New Colorway"}
          </p>
          {props.custom && (
            <div className={styles.actions}>
              {!isActive && (
                <p
                  className={styles.action}
                  role="button"
                  tabIndex="0"
                  aria-label={"Remove" + props.colorway?.label}
                  onClick={removeColorway}
                >
                  Remove Colorway
                </p>
              )}
            </div>
          )}
        </div>

        


    <div className={styles.swatches}>
          {renderSwatches()}
        </div>
      </button>
    </li>
  );
}
