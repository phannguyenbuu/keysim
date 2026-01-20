import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import TestingPane from "./TestingPane";
import OptionsPane from "./OptionsPane";
import styles from "./Sidebar.module.scss";
import ColorwayEditor from "../colorway/ColorwayEditor";
import { ReactComponent as Logo } from "../../assets/logo.svg";
import { ReactComponent as Name } from "../../assets/logo_text.svg";
import { ReactComponent as BackIcon } from "../../assets/icons/icon_arrow_left.svg";
import "./tabs.scss";

const HomeIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      fill="currentColor"
      d="M12 3.25l9 7.2v10.3a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-5.5h-3v5.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.45l9-7.2zm0 2.3L5 11.1V20h3.5v-5.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1V20H19v-8.9l-7-5.55z"
    />
  </svg>
);

export default function Sidebar() {
  const [tabIndex, setTabIndex] = useState(0);
  const isOnHome = tabIndex === 0;

  return (
    <div id="sidebar" className={styles.sidebar}>
      {/* <div className={styles.intro}>
        <div className={styles.logoWrapper}>
          <h1 aria-label="Keyboard Simulator">
            <Logo />
            <Name />
          </h1>
        </div>
      </div> */}
      <Tabs selectedIndex={tabIndex}
        style={{marginTop:0}}
       onSelect={(index) => setTabIndex(index)}>
        <TabList>
          <Tab tabIndex="0">
            {isOnHome ? <HomeIcon /> : <BackIcon />}
          </Tab>
          <Tab tabIndex="0">Editor</Tab>
          <Tab tabIndex="0">Test</Tab>
        </TabList>
        <TabPanel>
          <OptionsPane setTab={setTabIndex} />
        </TabPanel>
        <TabPanel>
          <ColorwayEditor />
        </TabPanel>
        <TabPanel>
          <TestingPane />
        </TabPanel>
      </Tabs>
    </div>
  );
}
