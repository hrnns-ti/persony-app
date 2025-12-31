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
            <path fill="none" stroke="#54bb7e" stroke-linecap="round" stroke-linejoin="round" d="M3.5 1.5h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2m7 7h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2m-6-1V10q0 1.5 1.5 1.5h2.5" stroke-width="1" />
        </svg>
    );
}