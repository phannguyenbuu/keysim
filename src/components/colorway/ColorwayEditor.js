import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ColorwayEditor.module.scss";
import Button from "../elements/Button";
import Swatch from "./Swatch";
import { getRandomAccent } from "../../util/color";
import ToggleField from "../elements/ToggleField";
import CollapsibleSection from "../containers/CollapsibleSection";
import jsQR from "jsqr";
import { useApiHost } from "../../store/useApiHost";
import { apiFetch } from "../../api/client";
import {
  selectColorway,
  setActiveSwatch,
  selectActiveSwatch,
  selectAvailableColorways,
  addCustomColorway,
  removeCustomColorway,
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
  const [renameFromId, setRenameFromId] = useState(null);
  const [advancedCode, setAdvancedCode] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const qrInputRef = useRef(null);

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

  useEffect(() => {
    if (colorway) {
      setAdvancedCode(JSON.stringify(colorway, null, 1));
      setCodeStatus("");
    }
  }, [colorway]);

  const handleChange = (e) => {
    setInputValue(e.target.value);  // lưu local realtime khi gõ
  };

  const isValidColorwayCode = (payload) => {
    if (!payload || typeof payload !== "object") return false;
    if (!payload.swatches || typeof payload.swatches !== "object") return false;
    if (!payload.override || typeof payload.override !== "object") return false;
    const swatches = Object.values(payload.swatches);
    if (!swatches.length) return false;
    return swatches.every(
      (swatch) =>
        swatch &&
        typeof swatch === "object" &&
        typeof swatch.background === "string" &&
        typeof swatch.foreground === "string"
    );
  };

  const handleAdvancedCodeChange = (e) => {
    setAdvancedCode(e.target.value);
    setCodeStatus("");
  };

  const applyAdvancedCodeText = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (!isValidColorwayCode(parsed)) {
        setCodeStatus("No valid code");
        return;
      }
      const normalized = {
        ...parsed,
        id: colorway.id,
        label: colorway.label,
      };
      dispatch(updateCustomColorway(normalized));
      setAdvancedCode(JSON.stringify(normalized, null, 1));
      setIsDirty(true);
      setCodeStatus("");
    } catch (error) {
      setCodeStatus("No valid code");
    }
  };

  const applyAdvancedCode = () => {
    applyAdvancedCodeText(advancedCode);
  };

  const handleQrClick = () => {
    if (qrInputRef.current) {
      qrInputRef.current.value = "";
      qrInputRef.current.click();
    }
  };

  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setCodeStatus("No valid code");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, canvas.width, canvas.height);
        if (!result?.data) {
          setCodeStatus("No valid code");
          return;
        }
        setAdvancedCode(result.data);
        applyAdvancedCodeText(result.data);
      };
      img.onerror = () => {
        setCodeStatus("No valid code");
      };
      img.src = reader.result;
    };
    reader.onerror = () => {
      setCodeStatus("No valid code");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    dispatch(toggleEditing());
    return () => {
      dispatch(toggleEditing());
    };
  }, [dispatch]);

  useEffect(() => {
    if (host && isDirty && colorway) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(
        () => saveToBackend(colorway, host, renameFromId),
        1000
      );
    }
  }, [colorway, host, isDirty, renameFromId]);

  const saveToBackend = async (colorwayData, apiHost, previousId) => {
    console.log(colorwayData);
    try {
      const targetId = previousId || colorwayData.id;
      await apiFetch(`/api/colorways/${targetId}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...colorwayData,
          previousId: previousId || undefined,
        }),
      }, apiHost);
      if (previousId) {
        setRenameFromId(null);
      }
    } catch (error) {
      console.error('Backend save failed:', error);
    }
  };

  const activeSwatch = useSelector(selectActiveSwatch);

  // console.log('CLW', colorway);
  const swatches = colorway ? Object.keys(colorway.swatches) : [];

  const handleBlur = (e) => {
    const nextLabelRaw = e.target.value.trim();
    if (!nextLabelRaw) {
      setInputValue(colorway.label);
      return;
    }
    const nextId = nextLabelRaw.replace(/[^\w\-_.]/g, "_");
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    updatedColorway.id = nextId;
    updatedColorway.label = nextId;
    if (nextId !== colorway.id) {
      dispatch(removeCustomColorway(colorway.id));
      dispatch(addCustomColorway(updatedColorway));
      dispatch(setColorway(updatedColorway.id));
      setRenameFromId(colorway.id);
    } else {
      dispatch(updateCustomColorway(updatedColorway));
    }
    setInputValue(updatedColorway.label);
    setIsDirty(true);
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
    setIsDirty(true);
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
    setIsDirty(true);
    let updatedColorway = JSON.parse(JSON.stringify(colorway));
    let new_swatch_id = "swatch-" + (Object.keys(colorway.swatches).length - 2);
    updatedColorway.swatches[new_swatch_id] = getRandomAccent();
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
  }, []);

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
          {/* <ToggleField
            value={paintWithKeys}
            label={"Apply swatches on keypress"}
            help={"Apply the selected swatch to a each key pressed."}
            handler={() => dispatch(togglePaintWithKeys())}
          /> */}

          <div className={styles.name}>
            {/* <label htmlFor="colorway_name" className={styles.label}>
              Name
            </label> */}
            <input
              type="text"
              id="colorway_name"
              name="colorway_name"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <fieldset style={{marginTop:20}}>
            {/* <legend className={styles.label}>Swatches</legend> */}
            {/* <p className={styles.description}>
              A swatch consists of a background color and a legend color.
            </p> */}

            <ul>{editableSwatchElements}</ul>
            <Button isText={false} title="Add Swatch" handler={addSwatch} />
          </fieldset>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Advanced">
        <div className={styles.json}>
          {/* <label htmlFor="colorway_json">Advanced Code</label> */}
          <span
            className={
              codeStatus ? styles.codeStatusInvalid : styles.codeStatus
            }
          >
            {codeStatus || " "}
          </span>
          <textarea
            readOnly
            id="colorway_json"
            name="colorway_json"
            spellCheck="false"
            value={advancedCode}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
