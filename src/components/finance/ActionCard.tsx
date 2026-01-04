interface ActionCardProps {
    title: string;
    icon: string | React.ReactElement;
    color: string;
}

export default function ActionCard({ title, icon, color }: ActionCardProps) {
    return (
        <button className={` bg-secondary border hover:bg-main border-line rounded-lg p-6 hover:border-slate-600 transition-all flex items-center justify-between group`}>
            <span className={`text-md hover:text-white font-bold text-${color}`}>{title}</span>
            <span className={`text-3xl group-hover:color-slate-white transition-transform`}>{icon}</span>
        </button>
    );
}
