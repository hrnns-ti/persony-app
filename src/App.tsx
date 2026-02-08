import React, { useState } from 'react';
import Sidebar, { AppTab } from './components/dashboard/Sidebar';

import FinancePage from './pages/Finance';
import WorkspacePage from './pages/Workspace';

function App() {
    const [activeTab, setActiveTab] = useState<AppTab>('finance');

    let content: React.ReactNode;
    switch (activeTab) {
        case 'workspace':
            content = <WorkspacePage />;
            break;
        case 'finance':
            content = <FinancePage />;
            break;
        case 'calendar':
            content = (
                <div className="flex-1 p-8 text-slate-300">
                    Calendar coming soon...
                </div>
            );
            break;
        case 'dashboard':
        default:
            content = (
                <div className="flex-1 p-8 text-slate-300">
                    Dashboard coming soon...
                </div>
            );
    }

    return (
        <div className="font-inconsola min-h-screen h-screen bg-main text-slate-100 flex overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 bg-main overflow-hidden flex flex-col">
                {content}
            </main>
        </div>
    );
}

export default App;