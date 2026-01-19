import React, {useState, useEffect} from "react";
import Button from "../elements/Button";
import styles from "./Swatch.module.scss";
import ColorPicker from "../elements/ColorPicker";
import store from "../../store/store";

export default function Swatch(props) {
  const [localSwatch, setLocalSwatch] = useState("#fffff");

  // console.log('props:',props);

// useEffect(() => {
//   console.log('Swatch useEffect active:', props.active, 'localSwatch:', localSwatch);  
//   if (props.active) setLocalSwatch(props.swatch);
// }, [props.active, props.swatch]);



  const handleChange = (value) => {
    // console.log("localSwatch",value,key);
    if (!value) return;
    props.handler(props.name, value);
  };



  const selectSwatchKeyboard = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      props.setSwatch(props.name);
    }
  };

  const isRequired =
    props.name === "base" || props.name === "mods" || props.name === "accent";

  const isActive = props.name === props.active;

  return (
    <li
      className={`${styles.swatch} ${isActive ? styles.active : ""}`}
      tabIndex="0"
      onKeyDown={selectSwatchKeyboard}
      // onClick={() => {
      //   props.setSwatch(props.name);
      //   console.log('Pick', props.name);
      // }}
     onClick={() => {
        // ✅ 1. Set active NAME
        props.setSwatch(props.name);
        setLocalSwatch(props.swatch);
        // ✅ 2. Set activeSwatch = FULL OBJECT {bg, text}
        const fullSwatch = {
          background: props.swatch.background,  // bg
          color: props.swatch.color
        };

        // console.log("COLOR", fullSwatch);
        
        window.activeSwatch = fullSwatch;  // Cho ColorUtil đọc
  
        // console.log('Set window.activeSwatch:', fullSwatch);
      }}


    >
      <p style={{paddingLeft: 20, fontSize:14, textTransform:'capitalize'}}>{props.name}</p>

      <div className={styles.info}>
        {/* <label>{props.name}</label> */}
        {!isRequired && (
          <Button
            isText={true}
            title="Remove Swatch"
            handler={() => {
              props.remove(props.name);
            }}
          />
        )}
      </div>

      <div className={styles.colors}>
        <div className={styles.color}>
          <ColorPicker
            isSwatch={true}
            label="Background"
            color={props.swatch.background}
            handler={(color) => {
              console.log("LEGEND___", color);
              handleChange(color, "background");
              // handleChange(color, "legend");
            }}
          />
        </div>

        <div className={styles.color}>
          {/* ✅ Legend: DIV preview thay ColorPicker */}
          <div className={styles.legendPreview}>
            <div 
              className={styles.colorPreview}
              style={{ backgroundColor: props.swatch.foreground}}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
