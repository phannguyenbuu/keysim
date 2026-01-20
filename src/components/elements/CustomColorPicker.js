import React, { useRef, useEffect, useState } from "react";
// import { CustomPicker } from "react-color";
import { EditableInput } from "react-color/lib/components/common";
import { Hue, Saturation } from "react-color/lib/components/common";
import pickerStyes from "./ColorPicker.module.scss";
import { useApiHost } from "../../store/useApiHost";
import { apiFetch } from "../../api/client";

export const MyPicker = ({ onChange }) => {
  const node = useRef();
  const { host } = useApiHost();
  const [colorCodes, setColorCodes] = useState({});
  const [palette, setPalette] = useState(() => {
    try {
      return localStorage.getItem("colorPickerPalette") || "gmk";
    } catch (e) {
      return "gmk";
    }
  });

  useEffect(() => {
    apiFetch(`/api/colors/${palette}`, {}, host)
      .then((res) => res.json())
      .then((data) => {
        const normalized = {};
        Object.entries(data || {}).forEach(([key, val]) => {
          if (typeof val === "string") {
            normalized[key] = { bg: val, text: "#000000" };
          } else {
            normalized[key] = {
              bg: val?.bg || "#ffffff",
              text: val?.text || "#000000",
            };
          }
        });
        setColorCodes(normalized);
      })
      .catch(() => {
        setColorCodes({});
      });
  }, [host, palette]);

  useEffect(() => {
    try {
      localStorage.setItem("colorPickerPalette", palette);
    } catch (e) {
      // ignore storage errors
    }
  }, [palette]);
 
  const swatches = Object.keys(colorCodes).map((code) => {
    return (
      <li
        key={code}
        tabIndex="0"
        aria-label={"color " + code}
        className={pickerStyes.colorSwatch}
        onClick={() => {
          
          console.log("Change_Color", colorCodes[code]);

          onChange({
            background: colorCodes[code].bg,   // react-color cần
            foreground: colorCodes[code].text // custom của bạn
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            
            onChange({
              background: colorCodes[code].bg,   // react-color cần
              foreground: colorCodes[code].text // custom của bạn
            });
          }
        }}
        style={{
          background: colorCodes[code].bg,
          color: colorCodes[code].text,
        }}
      >
        {code}
      </li>
    );
  });

  return (
    <div className={pickerStyes.dialogContainer} ref={node}>
      <div className={pickerStyes.paletteRow}>
        <button
          type="button"
          className={pickerStyes.paletteToggle}
          aria-label="Toggle palette"
          onClick={() => setPalette(palette === "gmk" ? "sa" : "gmk")}
        >
          <span
            className={`${pickerStyes.paletteSwitch} ${
              palette === "sa" ? pickerStyes.paletteSwitchSa : ""
            }`}
          />
          <span
            className={`${pickerStyes.paletteOption} ${
              palette === "gmk" ? pickerStyes.paletteOptionActive : ""
            }`}
          >
            GMK
          </span>
          <span
            className={`${pickerStyes.paletteOption} ${
              palette === "sa" ? pickerStyes.paletteOptionActive : ""
            }`}
          >
            SA
          </span>
        </button>
      </div>
      <div style={{ display: "flex" }}>
        <ul aria-label="list of gmk colors" style={{display: "flex",flexWrap: "wrap"}}>
          {swatches}
        </ul>
      </div>
    </div>
  );
};

export default MyPicker;
