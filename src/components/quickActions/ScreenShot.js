import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectActiveColorway } from "../../store/slices/colorways";
import styles from "./action.module.scss";
import { ReactComponent as CameraIcon } from "../../assets/icons/icon_camera.svg";

export default function ScreenShot() {
  const [visible, setVisible] = useState(false);
  const activeColorway = useSelector(selectActiveColorway);
  const qrData = activeColorway ? JSON.stringify(activeColorway) : "";
  return (
    <div
      role="button"
      aria-label="take screenshot"
      className={styles.action}
      onMouseEnter={() => {
        setVisible(true);
      }}
      onMouseLeave={() => {
        setVisible(false);
      }}
      onClick={() => {
        let event = new CustomEvent("screenshot", {
          detail: { qrData },
        });
        document.dispatchEvent(event);
      }}
    >
      <CameraIcon />
      {visible && (
        <div role="tooltip" className={styles.tooltip}>
          Take Screenshot
        </div>
      )}
    </div>
  );
}
