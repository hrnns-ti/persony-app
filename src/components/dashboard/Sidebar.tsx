import { useState } from 'react';

interface SidebarProps {
    activeTab?: 'dashboard' | 'calendar' | 'homework' | 'finance';
    onTabChange?: (tab: 'dashboard' | 'calendar' | 'homework' | 'finance') => void;
}

export default function Sidebar({ activeTab = 'dashboard', onTabChange }: SidebarProps) {
    const [active, setActive] = useState(activeTab);

    const handleTabChange = (tab: typeof activeTab) => {
        setActive(tab);
        onTabChange?.(tab);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'calendar', label: 'Calendar', icon: '📅' },
        { id: 'homework', label: 'Homework', icon: '📚' },
        { id: 'finance', label: 'Finance', icon: '💰' },
    ] as const;

    return (
        <aside className="w-64 bg-slate-950 border-r border-slate-800 h-screen flex flex-col p-6 sticky top-0">
            {/* Greeting Card */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 mb-8">
                <p className="text-sm text-slate-400 mb-1">Hello,</p>
                <h2 className="text-xl font-bold text-white">Haerunnas</h2>
                <p className="text-xs text-slate-500 mt-2">{getGreeting()}</p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                            active === item.id
                                ? 'bg-slate-800 text-orange-400 border-l-2 border-orange-400'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                        }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="pt-6 border-t border-slate-800">
                <button className="w-full px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all font-medium text-sm">
                    Log Out
                </button>
            </div>
        </aside>
    );
}
