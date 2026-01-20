import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ColorwayEditor.module.scss";
import Button from "../elements/Button";
import Swatch from "./Swatch";
import ColorUtil from "../../util/color";
import ToggleField from "../elements/ToggleField";
import CollapsibleSection from "../containers/CollapsibleSection";
import { useApiHost } from "../../store/useApiHost";
import {
  selectColorway,
  setActiveSwatch,
  selectActiveSwatch,
  selectAvailableColorways,
  updateCustomColorway,
  toggleEditing,
} from "../../store/slices/colorways";
import {
  togglePaintWithKeys,
  selectPaintWithKeys,
} from "../../store/slices/settings";

export default function ColorwayEditor() {
  const dispatch = useDispatch();
  const { host } = useApiHost();
  const colorwayId = useSelector(selectColorway);
  const paintWithKeys = useSelector(selectPaintWithKeys);
  const [inputValue, setInputValue] = useState("");

  const available = useSelector(selectAvailableColorways);
  
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef(null);

  const colorway = useMemo(
    () => (available || []).find(x => x.id === colorwayId),
    [available, colorwayId]
  );

  // ✅ FIX 2: TẠO COLORWAY MỚI TRONG useEffect
  // Không tự động tạo colorway mới khi không tìm thấy


  
  
  useEffect(() => {
    if (colorway?.label) {
      setInputValue(colorway.label);
    }
  }, [colorway]);

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
    if (host && isDirty) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToBackend(colorway, host), 1000);
    }
  }, [colorway, host, isDirty]);

  const saveToBackend = async (colorwayData, apiHost) => {
    console.log(colorwayData);
    try {
      await fetch(`${apiHost}/api/colorways/${colorwayData.label}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' },
        body: JSON.stringify(colorwayData),  // ✅ Toàn bộ colorway object
      });
    } catch (error) {
      console.error('Backend save failed:', error);
    }
  };

  const activeSwatch = useSelector(selectActiveSwatch);

  // console.log('CLW', colorway);
  const swatches = colorway ? Object.keys(colorway.swatches) : [];

  const handleBlur = (e) => {
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    updatedColorway.label = e.target.value;
    dispatch(updateCustomColorway(updatedColorway));
  };

  // const handleSwatchChange = (swatch, val) => {
  //   console.log('>>>>',colorway,val);
  //   let updatedColorway = JSON.parse(JSON.stringify(colorway));
  //   updatedColorway.swatches[swatch] = val;
  //   dispatch(updateCustomColorway(updatedColorway));
  //   document.dispatchEvent(new CustomEvent("force_key_material_update"));
  // };


  const handleSwatchChange = (swatch, val) => {
    setIsDirty(true);  // ✅
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    updatedColorway.swatches[swatch] = val;
    dispatch(updateCustomColorway(updatedColorway));
    document.dispatchEvent(new CustomEvent("force_key_material_update"));
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
    document.dispatchEvent(new CustomEvent("force_key_material_update"));
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

    // console.log("GH", swatch);
    
    return (
      <Swatch
        key={s}
        name={s}
        swatch={swatch}
        active={activeSwatch}
        handler={handleSwatchChange}
        remove={removeSwatch}
        setSwatch={(name) => {
          // console.log("LGG", name);
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

  if (!colorway || typeof colorway !== 'object') {
    return (
      <CollapsibleSection title="" open={true}>
        <div>Loading..</div>
      </CollapsibleSection>
    );
  }else


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
