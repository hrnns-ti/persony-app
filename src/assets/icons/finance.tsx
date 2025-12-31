interface IconProps {
    className?: string;
    size?: number | string;
}

export default function FinanceIcon({ className = "w-6 h-6", size }: IconProps) {
    const sizeClass = size ? `w-[${typeof size === 'number' ? size : size}px] h-[${typeof size === 'number' ? size : size}px]` : className;

    return (
        <svg
            className={sizeClass}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fill="none" stroke="#a17dd7" stroke-linecap="round" stroke-linejoin="round" d="m15.448 11.026l-1.031-3.29a4.9 4.9 0 0 1 0-2.925l1.051-3.35a.74.74 0 0 0-.927-.929L11.2 1.586a4.84 4.84 0 0 1-2.918 0L5 .552a.741.741 0 0 0-.92.955l.6 1.698a4.9 4.9 0 0 1-.276 3.886L.582 14.417c-.34.651.37 1.347 1.013.993l6.955-3.838a4.86 4.86 0 0 1 3.969-.325l1.98.702a.741.741 0 0 0 .949-.924z" stroke-width="1" />
        </svg>
    );
}

