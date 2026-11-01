import { useState, useEffect, useCallback } from 'react';

interface UseDrawerTransitionOptions {
  durationMs?: number;
}

interface UseDrawerTransitionReturn {
  isRendered: boolean;
  isVisible: boolean;
  handleClose: () => void;
}

/**
 * Hook untuk mengelola lifecycle animasi buka dan tutup (enter/exit transitions)
 * pada mobile bottom drawer dan slide-over panels sesuai Rule 128 & /auditaislop.
 *
 * Menjamin:
 * 1. Animasi keluar (exit transition) meluncur ke bawah secara mulus sebelum komponen di-unmount dari DOM.
 * 2. Backdrop memudar (fade out) seirama dengan bodi drawer.
 * 3. Tidak ada jeda atau kedipan (stutter-free hardware accelerated).
 */
export function useDrawerTransition(
  isOpen: boolean,
  onClose: () => void,
  options?: UseDrawerTransitionOptions
): UseDrawerTransitionReturn {
  const durationMs = options?.durationMs ?? 200;
  const [isRendered, setIsRendered] = useState<boolean>(isOpen);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let animFrame: number;

    if (isOpen) {
      setIsRendered(true);
      // Tunggu frame berikutnya agar browser me-render initial hidden state terlebih dahulu
      animFrame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      // Tunda unmount sampai animasi exit selesai
      timer = setTimeout(() => {
        setIsRendered(false);
      }, durationMs);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, durationMs]);

  // Handler penutupan gracefully dengan animasi exit
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, durationMs);
  }, [onClose, durationMs]);

  return { isRendered, isVisible, handleClose };
}
