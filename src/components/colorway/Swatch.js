import React from "react";
import Button from "../elements/Button";
import styles from "./Swatch.module.scss";
import ColorPicker from "../elements/ColorPicker";
// import { useApiHost } from "../../store/useApiHost";

export default function Swatch(props) {
  // const handleChange = (value, key) => {
  //   // if(!value) return;
  //   // let newSwatch = { ...props.swatch };
  //   // console.log("Val",value);
  //   // newSwatch[key] = value.hex;
  //   // props.handler(props.name, newSwatch);

  //   if(!value) return;
  //   // ✅ DEEP CLONE để tránh mutate
  //   let newSwatch = JSON.parse(JSON.stringify(props.swatch));
  //   newSwatch[key] = value.hex;
  //   props.handler(props.name, newSwatch);
  // };

  // const { host } = useApiHost();
  
  const handleChange = async (value, key) => {
  if (!value) return;

  let newSwatch = JSON.parse(JSON.stringify(props.swatch));
  newSwatch[key] = value.hex;

  // const updatedColorway = JSON.parse(JSON.stringify(props));
  
  // // Khởi tạo nếu chưa tồn tại
  // if (!updatedColorway.swatches) {
  //   updatedColorway.swatches = {};
  // }
  
  // updatedColorway.swatches[props.name] = newSwatch;

  props.handler(props.name, newSwatch);

  

  // try {
  //   const response = await fetch(`${host}/api/colorways/0_${props.name}`, {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(updatedColorway),
  //   });
  //   if (!response.ok) throw new Error('Failed to update backend colorway');
  // } catch (error) {
  //   console.error(error);
  // }
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
  console.log('label', props);

  return (
    <li
      className={`${styles.swatch} ${isActive ? styles.active : ""}`}
      tabIndex="0"
      onKeyDown={selectSwatchKeyboard}
      onClick={() => {
        props.setSwatch(props.name);
        console.log('Pick', props.name);
        // const color=props.swatch.background;
        // handleChange(color, "background");
      }}
    >
      {/* <ColorPicker
            isSwatch={true}
            label="Swatch/Background"
            color={props.swatch.color}
            handler={(color) => {
              handleChange(color, "background");
            }}
      /> */}
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
              handleChange(color, "background");
            }}
          />
        </div>

        <div className={styles.color}>
          <ColorPicker
            isSwatch={true}
            label="Legend"
            color={props.swatch.color}
            handler={(color) => {
              handleChange(color, "color");
            }}
          />
        </div>
      </div>
    </li>
  );
}
