interface IconProps {
    className?: string;
    size?: number | string;
}

export default function SavingIcon({ className = "w-6 h-6", size }: IconProps) {
    // FIXED: Simplified sizeClass
    const sizeClass = size ? `w-${size} h-${size}` : className;

    return (
        <svg
            className={sizeClass}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="none" stroke="#EB4648" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
                <path fill="none" stroke="#ec45a3" stroke-linecap="round" stroke-linejoin="round" d="m9.5 1l5 3v5.5m-1 3l-5.5 3l-5.5-3m-1-3V3.83L6.5 1m-5 3L8 8v7.5M14.5 4L8 8" stroke-width="1" />
            </g>
        </svg>
    );
}