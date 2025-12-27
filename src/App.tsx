import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";


import TransactionDebug from './components/debug/Transaction.tsx';

function App() {
    return <TransactionDebug />;
}

export default App;
