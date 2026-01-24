import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectActiveColorway } from "../../store/slices/colorways";
import styles from "./action.module.scss";

export default function PermalinkButton() {
  const [visible, setVisible] = useState(false);
  const [message] = useState(
    "Download a QR for this custom and send it to your vendor"
  );
  const activeColorway = useSelector(selectActiveColorway);
  const advancedCode = activeColorway ? JSON.stringify(activeColorway) : "";

  const downloadQr = async () => {
    if (!advancedCode) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
      advancedCode
    )}`;
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) return;
      const blob = await response.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "keysim-custom-qr.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("QR download failed", error);
    }
  };

  return (
    <div
      id="permalink"
      role="button"
      aria-label={message}
      onClick={downloadQr}
      className={styles.action}
      onMouseEnter={() => {
        setVisible(true);
      }}
      onMouseLeave={() => {
        setVisible(false);
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8 0h8v8h-8V5zm2 2v4h4V7h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0h-2v2h2v-2zm0 4h-2v2h4v-4h-2v2zm4-4h-2v2h2v-2zm0 4h-2v2h2v-2z"
        />
      </svg>
      {visible && (
        <div role="tooltip" className={styles.tooltip}>
          {message}
        </div>
      )}
    </div>
  );
}
