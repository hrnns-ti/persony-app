import {ReactNode} from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
    return (
        <div className={`bg-main rounded-lg p-6 ${className}`}
             onClick={onClick}
             role={onClick ? 'button' : undefined}
        > {children} </div>
    );
}