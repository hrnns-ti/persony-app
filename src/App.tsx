import React, { useState } from "react";
import Sidebar, { AppTab } from "./components/dashboard/Sidebar";
import HoverTitleBar from "./components/ui/HoverTitleBar";

import FinancePage from "./pages/Finance";
import WorkspacePage from "./pages/Workspace";

function App() {
    const [activeTab, setActiveTab] = useState<AppTab>("finance");

    let content: React.ReactNode;
    switch (activeTab) {
        case "workspace":
            content = <WorkspacePage />;
            break;
        case "finance":
            content = <FinancePage />;
            break;
        case "calendar":
            content = <div className="p-8 text-slate-300">Calendar coming soon...</div>;
            break;
        case "dashboard":
        default:
            content = <div className="p-8 text-slate-300">Dashboard coming soon...</div>;
    }

    return (
        <div className="font-inconsola h-screen w-screen bg-main text-slate-100 overflow-hidden relative">
            <HoverTitleBar />

            <div className="flex h-full min-h-0">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
                    {content}
                </main>
            </div>
        </div>
    );
}

export default App;
