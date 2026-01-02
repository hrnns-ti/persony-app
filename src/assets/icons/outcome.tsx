interface IconProps {
    className?: string;
    size?: number | string;
}

export default function IncomeIcon({ className = "w-6 h-6", size }: IconProps) {
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
                <path d="M8 1.5c5.2 0 6.5 1.3 6.5 6.5s-1.3 6.5-6.5 6.5S1.5 13.2 1.5 8S2.8 1.5 8 1.5" />
                <path d="M8 10.89c1.08 0 1.44.36 2.27.66a1 1 0 0 0 1.28-.55a.87.87 0 0 0-.03-.71l-2.68-5.4a.96.96 0 0 0-1.68 0l-2.68 5.4c-.23.47-.01 1.02.5 1.24c.23.1.5.12.75.02c.83-.3 1.19-.66 2.27-.66" />
            </g>
        </svg>
    );
}