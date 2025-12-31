import {ReactNode} from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
    return (
        <div className={`bg-slate-950 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow ${className}`}
             onClick={onClick}
             role={onClick ? 'button' : undefined}
        > {children} </div>
    );
}