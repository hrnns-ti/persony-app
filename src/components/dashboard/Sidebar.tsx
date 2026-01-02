import { useState } from 'react';
import {DashboardIcon, FinanceIcon, LearningIcon, CalendarIcon} from "../../assets/icons";

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
        { id: 'dashboard' as const, label: 'Dashboard', icon: DashboardIcon },
        { id: 'calendar' as const, label: 'Calendar', icon: CalendarIcon },
        { id: 'homework' as const, label: 'Learning Space', icon: LearningIcon },
        { id: 'finance' as const, label: 'Finance', icon: FinanceIcon },
    ] as const;

    return (
        <aside className="w-64 bg-main border-r border-line h-screen flex w-[25%] flex-col p-10 sticky top-0">
            {/* Greeting Card */}
            <div className="bg-secondary border border-line rounded-lg p-6">
                <p className="font-inconsola font-semibold text-sm text-slate-400 mb-1">Hello,</p>
                <h2 className="text-xl font-bold text-white font-inconsola font-semibold">Haerunnas</h2>
                <p className="text-xs text-slate-500 mt-2 font-inconsola font-semibold">{getGreeting()}</p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 flex-1 mt-8 bg-secondary border border-line gap-4 rounded-lg p-6">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium transition-all group ${
                            active === item.id
                                ? 'text-white-600'
                                : 'text-slate-400 hover:text-blue-400 '
                        }`}
                    >
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-opacity ${
                            active === item.id ? 'opacity-100' : 'opacity-70'
                        }`}/>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="pt-6 border-t border-slate-800">
                <button className="bg-secondary w-full font-semibold border border-line px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-all font-medium text-md">
                    Log Out
                </button>
            </div>
        </aside>
    );
}
