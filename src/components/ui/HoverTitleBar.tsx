import { useState } from "react";
import TitleBar from "./TitleBar";

export default function HoverTitleBar() {
    const [show, setShow] = useState(false);

    return (
        <>
            <div
                className="fixed top-0 left-0 right-0 h-3 z-[9998]"
                onMouseEnter={() => setShow(true)}
            />

            <div
                className={[
                    "fixed top-0 left-0 right-0 z-[9999]",
                    "transition-all duration-200 ease-out",
                    show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
                ].join(" ")}
                onMouseLeave={() => setShow(false)}
                onMouseEnter={() => setShow(true)}
            >
                <TitleBar />
            </div>
        </>
    );
}
