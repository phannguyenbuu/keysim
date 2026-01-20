import React from "react";
import ScreenShot from "./ScreenShot";
import styles from "./action.module.scss";

export default function QuickActions() {
  return (
    <div className={styles.actionBar}>
      <ScreenShot />
    </div>
  );
}
