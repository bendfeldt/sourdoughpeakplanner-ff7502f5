import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initialIsDark } from "@/hooks/use-theme";
import { keepSavedData } from "@/lib/saved-data";

// Right theme from the first paint, on every page
document.documentElement.classList.toggle("dark", initialIsDark());

// Ask the browser not to clear saved starters when space runs low
keepSavedData();

createRoot(document.getElementById("root")!).render(<App />);
