import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import "./index.css";

// Auto-handle Vite dynamic import chunk failures when a new version is deployed on server
window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    console.warn("New build version detected or chunk load failed. Reloading page...");
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
