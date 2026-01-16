import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ColorwayEditor.module.scss";
import Button from "../elements/Button";
import Swatch from "./Swatch";
import ColorUtil from "../../util/color";
import ToggleField from "../elements/ToggleField";
import CollapsibleSection from "../containers/CollapsibleSection";
import Util from "../../util/math";
import { useApiHost } from "../../store/useApiHost";
import {
  selectColorway,
  setActiveSwatch,
  selectActiveSwatch,
  selectColorways,
  updateCustomColorway,
  addCustomColorway,
  toggleEditing,
  setColorway,
} from "../../store/slices/colorways";
import {
  togglePaintWithKeys,
  selectPaintWithKeys,
} from "../../store/slices/settings";

export default function ColorwayEditor() {
  const dispatch = useDispatch();
  const { host } = useApiHost();
  const colorwayId = useSelector(selectColorway);
  const colorwayList = useSelector(selectColorways);
  const paintWithKeys = useSelector(selectPaintWithKeys);
  var colorway = colorwayList.find((x) => x.id === colorwayId);
  if (!colorway) {
    colorway = JSON.parse(JSON.stringify(ColorUtil.getColorway(colorwayId)));
    colorway.label += " modified";
    colorway.id = `cw_${Util.randString()}`;

    dispatch(addCustomColorway(colorway));
    dispatch(setColorway(colorway.id));
  }


  const [inputValue, setInputValue] = useState(colorway.label);

  const handleChange = (e) => {
    setInputValue(e.target.value);  // lưu local realtime khi gõ
  };

  useEffect(() => {
    dispatch(toggleEditing());
    return () => {
      dispatch(toggleEditing());
    };
  });

  useEffect(() => {
    if (colorway && host) {
      saveToBackend(colorway, host);
    }
  }, [colorway, host]);

  const saveToBackend = async (colorwayData, apiHost) => {
    console.log(colorwayData);
    try {
      await fetch(`${apiHost}/api/colorways/0_${colorwayData.label}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colorwayData),  // ✅ Toàn bộ colorway object
      });
    } catch (error) {
      console.error('Backend save failed:', error);
    }
  };

  const activeSwatch = useSelector(selectActiveSwatch);
  const swatches = colorway ? Object.keys(colorway.swatches) : [];

  const handleBlur = (e) => {
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    updatedColorway.label = e.target.value;
    dispatch(updateCustomColorway(updatedColorway));
  };

  const handleSwatchChange = (swatch, val) => {
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    updatedColorway.swatches[swatch] = val;
    dispatch(updateCustomColorway(updatedColorway));
    let event = new CustomEvent("force_key_material_update");
    document.dispatchEvent(event);


    
  };

  const removeSwatch = (name) => {
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    if (!updatedColorway.swatches[name]) return;
    Object.keys(updatedColorway.override).forEach((key) => {
      if (updatedColorway.override[key] === name)
        delete updatedColorway.override[key];
    });
    delete updatedColorway.swatches[name];
    dispatch(updateCustomColorway(updatedColorway));
    let event = new CustomEvent("force_key_material_update");
    document.dispatchEvent(event);
  };

  const addSwatch = () => {
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    let new_swatch_id = "swatch-" + (Object.keys(colorway.swatches).length - 2);
    updatedColorway.swatches[new_swatch_id] = ColorUtil.getRandomAccent();
    dispatch(updateCustomColorway(updatedColorway));
    dispatch(setActiveSwatch(new_swatch_id));
  };

  // const updateColorwayFromJson = (e) => {
  //   try {
  //     JSON.parse(e.target.value);
  //     dispatch(updateCustomColorway(JSON.parse(e.target.value)));
  //   } catch (e) {
  //     console.log("invalid colorway JSON");
  //     return;
  //   }
  // };

  const editableSwatchElements = swatches.map((s) => {
    let swatch = colorway.swatches[s];
    return (
      <Swatch
        key={s}
        name={s}
        swatch={swatch}
        active={activeSwatch}
        handler={handleSwatchChange}
        remove={removeSwatch}
        setSwatch={(name) => {
          dispatch(setActiveSwatch(name));
        }}
      />
    );
  });

  useEffect(() => {
    document.body.classList.add("editing");
    return () => {
      document.body.classList.remove("editing");
    };
  });

  return (
    <>
      <CollapsibleSection title="Colorway Editor" open={true}>
        <div className={styles.editor}>
          <ToggleField
            value={paintWithKeys}
            label={"Apply swatches on keypress"}
            help={"Apply the selected swatch to a each key pressed."}
            handler={() => dispatch(togglePaintWithKeys())}
          />

          <div className={styles.name}>
            <label htmlFor="colorway_name" className={styles.label}>
              Name
            </label>
            <input
              type="text"
              id="colorway_name"
              name="colorway_name"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <fieldset>
            <legend className={styles.label}>Swatches</legend>
            <p className={styles.description}>
              A swatch consists of a background color and a legend color.
            </p>

            <ul>{editableSwatchElements}</ul>
            <Button isText={false} title="Add Swatch" handler={addSwatch} />
          </fieldset>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Advanced">
        <div className={styles.json}>
          <label htmlFor="colorway_json">Colorway JSON (readonly)</label>
          <textarea
            readOnly
            id="colorway_json"
            name="colorway_json"
            spellCheck="false"
            value={JSON.stringify(colorway, null, 1)}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
