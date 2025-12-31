interface ActionCardProps {
    title: string;
    icon: string;
    color: string;
}

export default function ActionCard({ title, icon, color }: ActionCardProps) {
    return (
        <button className={`bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-${color}-500 transition-all flex items-center justify-between group`}>
            <span className="text-lg font-bold text-white">{title}</span>
            <span className={`text-3xl group-hover:scale-110 transition-transform`}>{icon}</span>
        </button>
    );
}
