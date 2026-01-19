import React, { useRef, useEffect } from "react";
// import { CustomPicker } from "react-color";
import { EditableInput } from "react-color/lib/components/common";
import { Hue, Saturation } from "react-color/lib/components/common";
import colorCodes from "../../config/colors/gmk";
import pickerStyes from "./ColorPicker.module.scss";
import ColorUtil from "../../util/color";

export const MyPicker = ({ onChange }) => {
  const node = useRef();
 
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
      <div style={{ display: "flex" }}>
        <ul aria-label="list of gmk colors" style={{display: "flex",flexWrap: "wrap"}}>
          {swatches}
        </ul>
      </div>
    </div>
  );
};

export default MyPicker;
