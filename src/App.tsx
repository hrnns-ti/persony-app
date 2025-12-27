import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";


import LearningDebug from './components/debug/Learning.tsx';

function App() {
    return <LearningDebug />;
}

export default App;