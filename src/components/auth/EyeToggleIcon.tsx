import React, { useEffect, useRef, useState } from 'react';

interface EyeToggleIconProps {
  isOpen: boolean;
  size?: number;
  className?: string;
}

/**
 * Animated Eye Toggle Icon (Icons8 Plumpy Duo-monochrome)
 * Uses a single horizontal 11-frame sprite sheet with zero-blink animation.
 * Frame 0: Eye closed (hidden password)
 * Frame 10: Eye open (shown password)
 */
export function EyeToggleIcon({
  isOpen,
  size = 20,
  className = ''
}: EyeToggleIconProps): React.JSX.Element {
  const [frame, setFrame] = useState(isOpen ? 10 : 0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const targetFrame = isOpen ? 10 : 0;
    const direction = isOpen ? 1 : -1;

    const interval = window.setInterval(() => {
      setFrame(prev => {
        if (prev === targetFrame) {
          window.clearInterval(interval);
          return prev;
        }
        const next = prev + direction;
        if ((direction === 1 && next >= targetFrame) || (direction === -1 && next <= targetFrame)) {
          window.clearInterval(interval);
          return targetFrame;
        }
        return next;
      });
    }, 32); // 32ms * 10 steps = ~320ms buttery-smooth transition

    return () => window.clearInterval(interval);
  }, [isOpen]);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: 'url(/icons/eye-spritesheet.png)',
        backgroundSize: `${size * 11}px ${size}px`,
        backgroundPosition: `-${frame * size}px 0px`,
        backgroundRepeat: 'no-repeat',
      }}
      className={`pointer-events-none select-none flex-shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
