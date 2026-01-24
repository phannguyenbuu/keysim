import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import threeApp from "../three/index";
import QuickActions from "../components/quickActions/QuickActions";

export default function Home() {
  const rootEl = useRef(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    threeApp(rootEl.current);
    if (rootEl.current) {
      rootEl.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      if (rootEl.current) {
        rootEl.current.focus();
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  return (
    <>
      {showSidebar && <Sidebar />}

      <div
        id="canvas-wrapper"
        ref={rootEl}
        tabIndex={0}
        role="region"
        aria-label="3d scene of keyboard"
      ></div>
      <QuickActions />
    </>
  );
}
