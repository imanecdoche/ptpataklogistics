import React, { useRef, useState, useEffect } from 'react';

interface RunningTextProps {
  text?: string | null;
  className?: string;
  placeholder?: string;
}

export function RunningText({
  text,
  className = '',
  placeholder = '-'
}: RunningTextProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [duration, setDuration] = useState(10);

  useEffect(() => {
    const checkOverflow = (): void => {
      if (!containerRef.current || !textRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;

      if (textWidth > containerWidth && containerWidth > 0) {
        setIsOverflowing(true);
        // Durasi dinamis berdasarkan panjang konten (kecepatan baca ~35px per detik)
        const calculatedDuration = Math.max(7, Math.round(textWidth / 35));
        setDuration(calculatedDuration);
      } else {
        setIsOverflowing(false);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [text]);

  if (!text || text.trim() === '') {
    return <span className={`text-[#aaaaaa] ${className}`}>{placeholder}</span>;
  }

  return (
    <div
      ref={containerRef}
      title={text}
      className={`overflow-hidden relative whitespace-nowrap max-w-full select-text cursor-default ${className}`}
    >
      {isOverflowing ? (
        <div
          className="animate-smooth-marquee"
          style={{ animationDuration: `${duration}s` }}
        >
          {/* Teks pertama */}
          <span ref={textRef} className="inline-block pr-8 font-inherit">
            {text}
          </span>
          {/* Duplikasi teks untuk looping marquee yang menyatu tanpa terputus */}
          <span aria-hidden="true" className="inline-block pr-8 font-inherit">
            {text}
          </span>
        </div>
      ) : (
        <span ref={textRef} className="inline-block font-inherit">
          {text}
        </span>
      )}
    </div>
  );
}
