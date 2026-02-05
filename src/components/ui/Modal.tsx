import React, { useEffect, useRef } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    // ESC to close + lock scroll
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        requestAnimationFrame(() => panelRef.current?.focus());

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-grey/80 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Modal panel */}
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="relative bg-main border border-line rounded-lg shadow-3xl w-[50%] mx-4 max-h-[90vh] overflow-y-auto outline-none"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {/*<div className="flex items-center justify-between ml-4 mt-2 p-6">*/}
                {/*    <h2 className="text-xl font-semibold text-white">{title}</h2>*/}
                {/*    <button*/}
                {/*        type="button"*/}
                {/*        onClick={onClose}*/}
                {/*        className="text-slate-400 hover:text-red transition-colors border hover:border-red border-slate-600 rounded-md p-1"*/}
                {/*        aria-label="Close modal"*/}
                {/*        title="Close"*/}
                {/*    >*/}
                {/*        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
                {/*            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />*/}
                {/*        </svg>*/}
                {/*    </button>*/}
                {/*</div>*/}

                {/* Content */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
