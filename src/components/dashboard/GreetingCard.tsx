export default function GreetingCard() {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
                {getGreeting()}, Haerunnas
            </h1>
            <p className="text-slate-400">Let's manage your finances today.</p>
        </div>
    );
}