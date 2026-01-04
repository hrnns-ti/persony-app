interface ActionCardProps {
    title: string;
    icon: string | React.ReactElement;
    color: string;
    onClick?: () => void;
}

export default function ActionCard({ title, icon, color, onClick }: ActionCardProps) {
    return (
        <button onClick={onClick}
                type="button"
                className={` bg-secondary border hover:bg-main border-line rounded-lg p-6 hover:border-slate-600 transition-all flex items-center justify-between group`}>
            <span className={`text-md hover:text-white font-bold text-${color}`}>{title}</span>
            <span className={`text-3xl group-hover:color-slate-white transition-transform`}>{icon}</span>
        </button>
    );
}