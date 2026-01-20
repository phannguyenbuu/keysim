import React, { useState, useMemo } from "react";
import Colorway from "./Colorway";
import Button from "../elements/Button";
import styles from "./ColorwayList.module.scss";
import { useSelector, useDispatch } from "react-redux";

import CollapsibleSection from "../containers/CollapsibleSection";
import SearchField from "../elements/SearchField";
import ColorUtil from "../../util/color";
import {
  setColorway,
  selectAvailableColorways,
  addCustomColorway,
} from "../../store/slices/colorways";

export default function ColorwayList(props) {
  const dispatch = useDispatch();
  const customColorways = useSelector(selectAvailableColorways);
  const [filter, setFilter] = useState("");
  const filteredColorways = useMemo(() => {
    const list = customColorways || [];
    const query = filter.trim().toLowerCase();
    const filtered = query
      ? list.filter((cw) => {
          const label = (cw.label || "").toLowerCase();
          const id = (cw.id || "").toLowerCase();
          return label.includes(query) || id.includes(query);
        })
      : list;
    return [...filtered].sort((a, b) =>
      (a.label || "").localeCompare(b.label || "", undefined, {
        sensitivity: "base",
      })
    );
  }, [customColorways, filter]);

  const addColorway = () => {
    const list = customColorways || [];
    const base = list.find(
      (cw) =>
        cw?.id === "My_Colorway_1" ||
        cw?.label === "My_Colorway_1" ||
        cw?.id === "My Colorway 1" ||
        cw?.label === "My Colorway 1"
    );
    const maxIndex = list.reduce((max, cw) => {
      const raw = cw?.id || cw?.label || "";
      const match = raw.match(/^My_Colorway_(\d+)$/i);
      if (!match) return max;
      const num = Number.parseInt(match[1], 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);
    const nextId = `My_Colorway_${maxIndex + 1}`;
    let cw = base
      ? JSON.parse(JSON.stringify(base))
      : ColorUtil.getColorwayTemplate(list.length + 1 || 1);
    cw.id = nextId;
    cw.label = nextId;
    dispatch(addCustomColorway(cw));
    dispatch(setColorway(cw.id));
  };

  return (
    <CollapsibleSection title="Colorways" open={true}>
      <div>
        <div className={styles.group}>
          <SearchField
            filter={(val) => {
              setFilter(val);
            }}
          />
          <Button
            title="Add"
            handler={addColorway}
            isText={false}
          />
        </div>
        {/* {filteredColorways.length ? (
          <div aria-hidden="true" className={styles.listLabel}>
            <span>My Colorways</span>
          </div>
        ) : null} */}
        <ul className={styles.list} aria-label="my custom colorways list">
          {filteredColorways.map((s) => (
              <Colorway 
                key={s.id} 
                colorway={s} 
                custom={true} 
                setTab={props.setTab} 
              />
            ))
          }
        </ul>
      </div>
    </CollapsibleSection>
  );
}
