import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedMayaData } from "./lib/mockData";

seedMayaData();

createRoot(document.getElementById("root")!).render(<App />);
