'use client';

import { useEffect, useRef, useState } from 'react';

export default function ScrollingName({ name, className }: { name: string, className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        // Delay a bit to ensure the DOM is settled for measurement
        const timer = setTimeout(() => {
            if (containerRef.current && contentRef.current) {
                const isOverflowing = contentRef.current.scrollWidth > containerRef.current.clientWidth;
                setShouldScroll(isOverflowing);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [name]);

    return (
        <div ref={containerRef} className={`w-full overflow-hidden flex justify-center ${className}`}>
            <div className="relative flex whitespace-nowrap">
                <div
                    ref={contentRef}
                    className={`whitespace-nowrap ${shouldScroll ? 'animate-marquee-single' : ''}`}
                >
                    {name}
                </div>
                {shouldScroll && (
                    <div className="whitespace-nowrap animate-marquee-single pl-20" aria-hidden="true">
                        {name}
                    </div>
                )}
            </div>
        </div>
    );
}
