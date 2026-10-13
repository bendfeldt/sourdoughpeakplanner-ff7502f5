import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initialIsDark } from "@/hooks/use-theme";

// Right theme from the first paint, on every page
document.documentElement.classList.toggle("dark", initialIsDark());

createRoot(document.getElementById("root")!).render(<App />);
