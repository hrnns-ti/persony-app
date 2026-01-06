interface IconProps {
    className?: string;
    size?: number | string;
}

export default function LearningIcon({ className = "w-6 h-6", size }: IconProps) {
    const sizeClass = size ? `w-[${typeof size === 'number' ? size : size}px] h-[${typeof size === 'number' ? size : size}px]` : className;

    return (
        <svg
            className={sizeClass}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fill="none" stroke="#90cfe8" stroke-linecap="round" stroke-linejoin="round" d="M6.41 12c0 .9-.47 1.72-1.23 2.17c-.76.44-1.7.44-2.45 0A2.5 2.5 0 0 1 1.5 12c0-1.38 1.1-2.5 2.46-2.5A2.48 2.48 0 0 1 6.4 12h0Zm3.78-7.23A2.85 2.85 0 0 0 4.6 3.6a2.9 2.9 0 0 0 1.77 3.5c2.19.88 2.7 1.75 2.43 4.13a2.85 2.85 0 0 0 5.58 1.17a2.9 2.9 0 0 0-1.77-3.5c-2.19-.88-2.7-1.76-2.43-4.13h0Z" stroke-width="1" />
        </svg>
    );
}