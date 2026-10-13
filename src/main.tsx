import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Follow the device's dark mode on every page, not only once the calculator has mounted
document.documentElement.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);

createRoot(document.getElementById("root")!).render(<App />);
