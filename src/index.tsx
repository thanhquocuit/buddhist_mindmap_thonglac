import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import Home from "./HomePage";
import PhapHanhPage from "./PhapHanhPage";
import TriKienGiaiThoatPage from "./TriKienGiaiThoatPage";
import SachNoiPage from "./SachNoiPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { faFontAwesome } from "@fortawesome/free-brands-svg-icons";
import PromptBoxWrapper from "./partials/PromptBox";
import "bootstrap/dist/css/bootstrap.css"; // Importing the Bootstrap CSS
import "./index.css";
import "../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

library.add(fas, faFontAwesome);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="phap-hanh" element={<PhapHanhPage />} />
        <Route path="tri-kien-giai-thoat" element={<TriKienGiaiThoatPage />} />
        <Route path="sach-noi" element={<SachNoiPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
    <PromptBoxWrapper />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
