import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";


import NotesDebug from './components/debug/Note.tsx';

function App() {
    return <NotesDebug />;
}
export default App;