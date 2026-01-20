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

import { ReactComponent as PlusIcon } from "../../assets/icons/icon_plus.svg";

export default function ColorwayList(props) {
  const dispatch = useDispatch();
  const customColorways = useSelector(selectAvailableColorways);
  const [filter, setFilter] = useState("");
  const filteredColorways = useMemo(() => {
    const list = customColorways || [];
    const query = filter.trim().toLowerCase();
    if (!query) return list;
    return list.filter((cw) => {
      const label = (cw.label || "").toLowerCase();
      const id = (cw.id || "").toLowerCase();
      return label.includes(query) || id.includes(query);
    });
  }, [customColorways, filter]);

  const addColorway = (e) => {
    let cw = ColorUtil.getColorwayTemplate(customColorways?.length + 1 || 1);
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
          {/* <Button
            title="Add"
            icon={<PlusIcon />}
            className={styles.add}
            handler={addColorway}
            tabIndex="0"
          >
            <PlusIcon />
            <span>Add New Colorway</span>
          </Button> */}
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
