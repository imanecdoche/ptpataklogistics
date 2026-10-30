import React, { useState, useEffect, useRef } from 'react';

interface MobileRubberBandProps {
  containerRef: React.RefObject<HTMLElement | null>;
  isDispatcherTab?: boolean;
}

export function MobileRubberBand({
  containerRef,
  isDispatcherTab = false
}: MobileRubberBandProps): React.JSX.Element | null {
  const [pullDistance, setPullDistance] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isTriggerReady, setIsTriggerReady] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(false);
  const isTriggerReadyRef = useRef(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent): void => {
      // Hanya aktif di mobile / layar sentuh
      if (window.innerWidth >= 768) return;

      const touch = e.touches[0];
      if (!touch) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      // Periksa apakah scroll sudah berada di titik paling bawah
      isAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 2;
      startYRef.current = touch.clientY;
      setIsReleasing(false);
      isTriggerReadyRef.current = false;
      setIsTriggerReady(false);
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (startYRef.current === null || !isAtBottomRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      const rawDelta = startYRef.current - currentY; // Positif saat usap ke atas (tarik melewati bawah)

      if (rawDelta > 0) {
        // Resistansi karet berbobot (damping factor 0.4x), diperbesar kapasitas kubah hingga 135px
        // agar menampung seluruh komponen (ikon GIF + teks) secara lapang tanpa terpotong
        const damped = Math.min(rawDelta * 0.4, 135);
        setPullDistance(damped);

        if (isDispatcherTab) {
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
        }
      } else {
        setPullDistance(0);
        if (isDispatcherTab) {
          isTriggerReadyRef.current = false;
          setIsTriggerReady(false);
        }
      }
    };

    const handleTouchEnd = (): void => {
      if (isDispatcherTab && isTriggerReadyRef.current) {
        window.dispatchEvent(new CustomEvent('patak:open-dispatch-drawer'));
      }

      startYRef.current = null;
      isAtBottomRef.current = false;
      isTriggerReadyRef.current = false;
      setIsTriggerReady(false);

      // Pantul cepat kembali ke bawah (snap-back ~240ms cubic-bezier)
      setIsReleasing(true);
      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerRef, isDispatcherTab]);

  if (pullDistance === 0 && !isReleasing) {
    return null;
  }

  // Transparansi seimbang (sama persis antara icon GIF dan teks)
  // Mulai muncul halus saat kubah mulai terbentuk (> 20px) hingga 0.8 pada tarikan penuh
  const sharedOpacity = pullDistance > 20 ? Math.min((pullDistance - 20) / 60, 0.8) : 0;

  const domeFill = isDispatcherTab && isTriggerReady ? '#111111' : '#ffffff';

  return (
    <div
      aria-hidden="true"
      className="md:hidden fixed bottom-0 left-0 right-0 pointer-events-none z-40 flex items-end justify-center overflow-hidden"
      style={{
        height: `${pullDistance}px`,
        transition: isReleasing ? 'height 240ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
      }}
    >
      {/* Setengah Lingkaran / Kubah Karet Elastis Warna Putih / Hitam */}
      <svg
        className="absolute inset-0 w-full h-full transition-colors duration-200"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Kurva busur kubah cubic bezier dengan bahu lebar agar ruang komponen lapang */}
        <path
          d="M 0 100 C 15 0, 85 0, 100 100 Z"
          fill={domeFill}
        />
      </svg>

      {/* Konten Ter-clip di Dalam Kubah: Icon GIF & Teks Semitransparan */}
      <div
        className="relative z-10 flex flex-col items-center justify-center pb-5 select-none"
        style={{
          opacity: sharedOpacity,
          transition: isReleasing ? 'opacity 240ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
      >
        <img
          src="/icons/icons8-down.gif"
          alt=""
          className={`w-5 h-5 object-contain pointer-events-none transition-all duration-200 ${
            isDispatcherTab
              ? isTriggerReady
                ? 'rotate-180 invert'
                : 'rotate-180 mix-blend-multiply'
              : 'mix-blend-multiply'
          }`}
        />
        <span
          className={`text-[11px] mt-1 whitespace-nowrap transition-colors duration-200 ${
            isDispatcherTab
              ? isTriggerReady
                ? 'font-bold text-white tracking-wider'
                : 'font-medium text-[#555555]'
              : 'font-medium text-[#555555]'
          }`}
        >
          {isDispatcherTab
            ? isTriggerReady
              ? 'LEPASS!!!'
              : 'Tarik lagi untuk membuka riwayat!'
            : 'Sudah mentok, Pak!'}
        </span>
      </div>
    </div>
  );
}
