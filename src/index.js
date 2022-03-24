import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { MoralisProvider } from "react-moralis";
import "./index.css";

const APP_ID = process.env.REACT_APP_MORALIS_APPLICATION_ID;
const SERVER_URL = process.env.REACT_APP_MORALIS_SERVER_URL;
const IS_PRODUCTION_MODE = process.env.NODE_ENV !== "development";

const Application = () => {
  const isServerInfoConfigured = APP_ID && SERVER_URL ? true : false;
  console.log(`True Freeze front end is running in ${IS_PRODUCTION_MODE ? 'production' : 'dev'} mode.`);

  //Validate
  if (!APP_ID || !SERVER_URL)
    throw new Error(
      "Missing Moralis Application ID or Server URL. Make sure to set your .env file.",
    );
  if (isServerInfoConfigured) {
    return (
      <MoralisProvider appId={APP_ID} serverUrl={SERVER_URL}>
        <App isProductionMode={IS_PRODUCTION_MODE} />
      </MoralisProvider>
    );
  } else {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        Server environment variables missing. Cannot render True Freeze
        application.
      </div>
    );
  }
};

ReactDOM.render(
  <StrictMode>
    <Application />,
  </StrictMode>,
  document.getElementById("root"),
);
