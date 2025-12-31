interface IconProps {
    className?: string;
    size?: number | string;
}

export default function DashboardIcon({ className = "w-6 h-6", size }: IconProps) {
    const sizeClass = size ? `w-[${typeof size === 'number' ? size : size}px] h-[${typeof size === 'number' ? size : size}px]` : className;

    return (
        <svg
            className={sizeClass}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g strokeLinecap="round" strokeLinejoin="round">
                <path stroke="#f6a658" d="M9 12a3 3 0 1 1 6 0a3 3 0 0 1-6 0" strokeWidth="1" />
                <path stroke="#ec8145" d="M7 12c0 1.75-1.25 3-3 3s-3-1.25-3-3V9h6zm2-8c0-1.75 1.25-3 3-3s3 1.25 3 3v3H9Z" strokeWidth="1" />
            </g>
        </svg>
    );
}
