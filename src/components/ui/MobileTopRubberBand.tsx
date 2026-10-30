import React, { useState, useEffect, useRef } from 'react';

interface MobileTopRubberBandProps {
  headerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileTopRubberBand({
  headerRef,
  contentRef,
  isOpen,
  onClose
}: MobileTopRubberBandProps): React.JSX.Element | null {
  const [pullDistance, setPullDistance] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isTriggerReady, setIsTriggerReady] = useState(false);

  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const isTriggerReadyRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setPullDistance(0);
      setIsReleasing(false);
      setIsTriggerReady(false);
      isTriggerReadyRef.current = false;
      isPullingRef.current = false;
      startYRef.current = null;
      return;
    }

    const header = headerRef.current;
    const content = contentRef.current;

    const handleHeaderTouchStart = (e: TouchEvent): void => {
      if (window.innerWidth >= 768) return;
      const touch = e.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
      isPullingRef.current = true;
      setIsReleasing(false);
      isTriggerReadyRef.current = false;
      setIsTriggerReady(false);
    };

    const handleContentTouchStart = (e: TouchEvent): void => {
      if (window.innerWidth >= 768) return;
      const touch = e.touches[0];
      if (!touch) return;

      // Hanya izinkan tarikan dari atas jika scroll tabel berada di titik teratas
      if (content && content.scrollTop <= 0) {
        startYRef.current = touch.clientY;
        isPullingRef.current = true;
        setIsReleasing(false);
        isTriggerReadyRef.current = false;
        setIsTriggerReady(false);
      }
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (!isPullingRef.current || startYRef.current === null) return;

      const touch = e.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      const rawDelta = currentY - startYRef.current; // Positif saat ditarik ke arah bawah

      if (rawDelta > 0) {
        // Damping factor 0.4x dengan kapasitas kubah atas 135px
        const damped = Math.min(rawDelta * 0.4, 135);
        setPullDistance(damped);

        const ready = damped >= 75;
        if (ready && !isTriggerReadyRef.current) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(25);
            } catch (_) {}
          }
        }
        isTriggerReadyRef.current = ready;
        setIsTriggerReady(ready);
      } else {
        setPullDistance(0);
        isTriggerReadyRef.current = false;
        setIsTriggerReady(false);
      }
    };

    const handleTouchEnd = (): void => {
      if (!isPullingRef.current) return;

      if (isTriggerReadyRef.current) {
        onClose();
      }

      startYRef.current = null;
      isPullingRef.current = false;
      isTriggerReadyRef.current = false;
      setIsTriggerReady(false);

      // Snap-back kubah atas kembali ke atas
      setIsReleasing(true);
      setPullDistance(0);
    };

    if (header) {
      header.addEventListener('touchstart', handleHeaderTouchStart, { passive: true });
    }
    if (content) {
      content.addEventListener('touchstart', handleContentTouchStart, { passive: true });
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      if (header) {
        header.removeEventListener('touchstart', handleHeaderTouchStart);
      }
      if (content) {
        content.removeEventListener('touchstart', handleContentTouchStart);
      }
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isOpen, headerRef, contentRef, onClose]);

  if (pullDistance === 0 && !isReleasing) {
    return null;
  }

  const sharedOpacity = pullDistance > 20 ? Math.min((pullDistance - 20) / 60, 0.8) : 0;
  const domeFill = isTriggerReady ? '#111111' : '#ffffff';

  return (
    <div
      aria-hidden="true"
      className="md:hidden fixed top-0 left-0 right-0 pointer-events-none z-[60] flex items-start justify-center overflow-hidden"
      style={{
        height: `${pullDistance}px`,
        transition: isReleasing ? 'height 240ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
      }}
    >
      {/* Setengah Lingkaran / Kubah Karet Elastis Atas (Menjorok ke Bawah) */}
      <svg
        className="absolute inset-0 w-full h-full transition-colors duration-200"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 0 C 15 100, 85 100, 100 0 Z"
          fill={domeFill}
        />
      </svg>

      {/* Konten Ter-clip di Dalam Kubah Atas: Icon GIF & Teks Semitransparan */}
      <div
        className="relative z-10 flex flex-col items-center justify-center pt-5 select-none"
        style={{
          opacity: sharedOpacity,
          transition: isReleasing ? 'opacity 240ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
      >
        <img
          src="/icons/icons8-down.gif"
          alt=""
          className={`w-5 h-5 object-contain pointer-events-none transition-all duration-200 ${
            isTriggerReady ? 'invert' : 'mix-blend-multiply'
          }`}
        />
        <span
          className={`text-[11px] mt-1 whitespace-nowrap transition-colors duration-200 ${
            isTriggerReady
              ? 'font-bold text-white tracking-wider'
              : 'font-medium text-[#555555]'
          }`}
        >
          {isTriggerReady ? 'LEPASS!!!' : 'Tarik lagi untuk menutup!'}
        </span>
      </div>
    </div>
  );
}
