import React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";
import store from "./store/store";
import { Provider } from "react-redux";
import { ApiHostProvider } from "./store/useApiHost";
import * as serviceWorker from "./serviceWorker";

// if (process.env.NODE_ENV === "development") {
//   const axe = require("react-axe");
//   axe(React, ReactDOM, 1000);
// }
const container = document.getElementById("root"); // Kiểm tra element này có thật?
if (!container) {
  throw new Error("Root container missing in HTML");
}

const root = createRoot(container);

root.render(
  <ApiHostProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </ApiHostProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
