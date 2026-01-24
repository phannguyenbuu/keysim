import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./TestingPane.module.scss";
import { wordsPerMinTest } from "wpmtest";
import CollapsibleSection from "../containers/CollapsibleSection";
import Button from "../elements/Button";
import ColorUtil from "../../util/color";
import KeyUtil from "../../util/keyboard";

const minutes = 1;
var timer;

const wpmTest = new wordsPerMinTest(() => {}, minutes, {});

export default function TypingTest() {
  const [wpm, setWpm] = useState("---");
  const [count, setCount] = useState(1000 * 60 * minutes);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentText, setCurrentText] = useState(wpmTest.curDisplayText);
  const wordsRef = useRef(null);
  const colorway = ColorUtil.colorway;

  useEffect(() => {
    wpmTest.stopwatch.onDone(() => {
      clearInterval(timer);
      setFinished(true);
      setCount(0); //just in case sometimes rounds up to 1
      setCurrentText("complete");
      setWpm(Math.round(wpmTest.averageWPM));
    });
  }, []);

  useEffect(() => {
    if (wordsRef.current) {
      wordsRef.current.focus();
    }
  }, []);

  const start = () => {
    wpmTest.startStopWatch();
    setStarted(true);
    timer = setInterval(() => {
      setCount((count) => count - 1000);
    }, 1000);
  };

  const reset = () => {
    setWpm("---");
    setStarted(false);
    setFinished(false);
    clearInterval(timer);
    wpmTest.restartTest();
    setCurrentText(wpmTest.curDisplayText);
    setCount(1000 * 60 * minutes);
  };

  const handleKeypress = (e) => {
    if (finished) return;
    if (!started) start();
    wpmTest.checkKeyChar(e.key);
    setCurrentText(wpmTest.curDisplayText);
  };

  const mapCharToCode = (char) => {
    if (!char) return null;
    if (char === " ") return "KC_SPC";
    if (char === "\n") return "KC_ENT";
    if (char === "\t") return "KC_TAB";
    if (/[a-z]/i.test(char)) return `KC_${char.toUpperCase()}`;
    if (/[0-9]/.test(char)) return `KC_${char}`;
    const map = {
      "-": "KC_MINS",
      "_": "KC_MINS",
      "=": "KC_EQL",
      "+": "KC_EQL",
      "[": "KC_LBRC",
      "{": "KC_LBRC",
      "]": "KC_RBRC",
      "}": "KC_RBRC",
      "\\": "KC_BSLS",
      "|": "KC_BSLS",
      ";": "KC_SCLN",
      ":": "KC_SCLN",
      "'": "KC_QUOT",
      "\"": "KC_QUOT",
      ",": "KC_COMM",
      "<": "KC_COMM",
      ".": "KC_DOT",
      ">": "KC_DOT",
      "/": "KC_SLSH",
      "?": "KC_SLSH",
      "`": "KC_GRV",
      "~": "KC_GRV",
      "!": "KC_1",
      "@": "KC_2",
      "#": "KC_3",
      "$": "KC_4",
      "%": "KC_5",
      "^": "KC_6",
      "&": "KC_7",
      "*": "KC_8",
      "(": "KC_9",
      ")": "KC_0",
    };
    return map[char] || null;
  };

  useEffect(() => {
    if (finished) {
      document.dispatchEvent(new CustomEvent("typing_next_key", { detail: {} }));
      return;
    }
    const nextChar = currentText?.charAt(0);
    const code = mapCharToCode(nextChar);
    document.dispatchEvent(
      new CustomEvent("typing_next_key", { detail: { code } })
    );
  }, [currentText, finished]);

  const isSpaceFirst = () => currentText.charAt(0) === " ";

  const nextChar = useMemo(() => currentText.charAt(0), [currentText]);
  const nextCode = useMemo(() => mapCharToCode(nextChar), [nextChar]);
  const nextSwatch = useMemo(() => {
    if (!nextCode) return null;
    const swatches = colorway?.swatches || {};
    const override = colorway?.override?.[nextCode] || "";
    const group = KeyUtil.isMod(nextCode) && swatches.mods ? "mods" : "base";
    return swatches[override || group] || swatches.base || null;
  }, [colorway, nextCode]);
  const nextCharColor = nextSwatch?.background || null;

  return (
    <CollapsibleSection title="Typing Speed Test" open={true}>
      <div className={styles.wpmContainer}>
        <h3>
          WPM: <span className={styles.wpmNumber}>{wpm}</span>
        </h3>
        <Button title="Reset" handler={reset} />
      </div>
      <div>
        <div className={styles.timer}>
          <p>Time Remaining: {count / 1000}s</p>
          <p>The timer will start when you start typing.</p>
        </div>
        <div
          tabIndex="0"
          ref={wordsRef}
          data-typing-input="true"
          className={styles.words}
          onKeyDown={handleKeypress}
          onClick={() => wordsRef.current && wordsRef.current.focus()}
        >
          {!finished && !isSpaceFirst() ? (
            <span>
              <span style={nextCharColor ? { color: nextCharColor } : null}>
                {nextChar}
              </span>
              {currentText.slice(1)}
            </span>
          ) : (
            <span>{currentText}</span>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
