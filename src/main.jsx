// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

console.log("main.jsx loading");

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="color: white; padding: 20px;">ERROR: Root element not found</div>';
} else {
  console.log("Rendering app to root element");
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
