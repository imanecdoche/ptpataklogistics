import React, { useState, useEffect, useRef, useCallback } from 'react';
import reconnectingGif from '../../../assets/offline-reconnecting.gif';
import disconnectedGif from '../../../assets/offline-disconnected.gif';

export function OfflineOverlay(): React.JSX.Element {
  const [isOffline, setIsOffline] = useState(false);
  const [secondsOffline, setSecondsOffline] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // In-memory Blob URLs yang 100% tersimpan di RAM browser dan kebal dari pemutusan jaringan
  const [reconnectingBlob, setReconnectingBlob] = useState<string>(reconnectingGif);
  const [disconnectedBlob, setDisconnectedBlob] = useState<string>(disconnectedGif);

  const secondsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const probeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preload kedua aset animasi GIF ke RAM memory cache browser (Blob URL) sejak awal aplikasi dibuka
  useEffect(() => {
    let active = true;

    const convertToRamBlob = async (url: string, setter: (val: string) => void) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const blob = await response.blob();
        if (active) {
          const blobUrl = URL.createObjectURL(blob);
          setter(blobUrl);

          // Eagerly decode frame animasi ke bitmap memory browser
          const img = new Image();
          img.src = blobUrl;
          if (img.decode) {
            img.decode().catch(() => {});
          }
        }
      } catch (_) {
        // Tetap menggunakan URL import static sebagai fallback
      }
    };

    convertToRamBlob(reconnectingGif, setReconnectingBlob);
    convertToRamBlob(disconnectedGif, setDisconnectedBlob);

    return () => {
      active = false;
    };
  }, []);

  // Fungsi pengujian konektivitas riil (Probe)
  const probeOnline = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/icons/pt-logo.png?probe=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (_) {
      return false;
    }
  }, []);

  const handleConnectionRestored = useCallback((): void => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsOffline(false);
      setIsFadingOut(false);
      setSecondsOffline(0);
    }, 300);
  }, []);

  const handleConnectionLost = useCallback((): void => {
    setIsFadingOut(false);
    setIsOffline(true);
  }, []);

  // Event listener browser online / offline & test listener
  useEffect(() => {
    const handleOnlineEvent = async (): Promise<void> => {
      const isActuallyOnline = await probeOnline();
      if (isActuallyOnline) {
        handleConnectionRestored();
      }
    };

    const handleOfflineEvent = (): void => {
      handleConnectionLost();
    };

    // Event custom untuk kemudahan pengujian simulasi tanpa harus mematikan koneksi
    const handleSimulateOffline = (): void => {
      handleConnectionLost();
    };
    const handleSimulateOnline = (): void => {
      handleConnectionRestored();
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);
    window.addEventListener('patak:test-offline', handleSimulateOffline);
    window.addEventListener('patak:test-online', handleSimulateOnline);

    // Initial check jika saat pertama buka browser memang offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleConnectionLost();
    }

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
      window.removeEventListener('patak:test-offline', handleSimulateOffline);
      window.removeEventListener('patak:test-online', handleSimulateOnline);
    };
  }, [probeOnline, handleConnectionRestored, handleConnectionLost]);

  // Timer counter detik & probe berkala saat berstatus offline
  useEffect(() => {
    if (isOffline) {
      // Hitung durasi offline setiap 1 detik
      secondsTimerRef.current = setInterval(() => {
        setSecondsOffline(prev => prev + 1);
      }, 1000);

      // Probe setiap 3.5 detik untuk mendeteksi saat internet diam-diam sudah pulih
      probeTimerRef.current = setInterval(async () => {
        const online = await probeOnline();
        if (online) {
          handleConnectionRestored();
        }
      }, 3500);
    } else {
      if (secondsTimerRef.current) clearInterval(secondsTimerRef.current);
      if (probeTimerRef.current) clearInterval(probeTimerRef.current);
    }

    return () => {
      if (secondsTimerRef.current) clearInterval(secondsTimerRef.current);
      if (probeTimerRef.current) clearInterval(probeTimerRef.current);
    };
  }, [isOffline, probeOnline, handleConnectionRestored]);

  // Tombol Manual Retry ("Coba Hubungkan Ulang")
  const handleManualRetry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      const online = await probeOnline();
      if (online) {
        handleConnectionRestored();
      } else {
        // Reset countdown sedikit untuk memberi feedback percobaan ulang
        setSecondsOffline(10);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const isMoreThanTenSeconds = secondsOffline >= 10;
  const isVisible = isOffline || isFadingOut;

  return (
    <>
      {/* 
        Preload Container Permanen di DOM:
        Memastikan browser selalu mengunduh dan men-decode kedua GIF ke RAM memory cache 
        saat online, sehingga saat koneksi terputus gambar sudah 100% siap tampil tanpa request jaringan.
      */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <img src={reconnectingBlob} alt="" />
        <img src={disconnectedBlob} alt="" />
      </div>

      {isVisible && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center select-none h-dvh max-h-dvh w-full overflow-hidden transition-opacity duration-300 ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* 
            Container Animasi GIF Dual-Layer dengan Desktop Scaling:
            Ukuran mobile: 96px (w-24 h-24), Desktop: 176px (md:w-44 md:h-44).
          */}
          <div className="w-24 h-24 md:w-44 md:h-44 relative flex items-center justify-center transition-all duration-300">
            <img
              src={reconnectingBlob}
              alt="Menghubungkan Ulang"
              className={`w-24 h-24 md:w-44 md:h-44 object-contain pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                isMoreThanTenSeconds ? 'opacity-0 pointer-events-none invisible' : 'opacity-100'
              }`}
            />
            <img
              src={disconnectedBlob}
              alt="Koneksi Terputus"
              className={`w-24 h-24 md:w-44 md:h-44 object-contain pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                isMoreThanTenSeconds ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'
              }`}
            />
          </div>

          {/* Fase 1: Menghubungkan Ulang (< 10 Detik) dengan Desktop Scaling */}
          {!isMoreThanTenSeconds && (
            <div className="mt-4 md:mt-6 max-w-sm md:max-w-md px-2 animate-in fade-in duration-200">
              <h2 className="text-sm md:text-xl font-bold text-[#111111] tracking-tight transition-all duration-300">
                Waduh. Kayaknya koneksi terputus nih!
              </h2>
              <p className="text-xs md:text-sm text-[#666666] mt-1.5 md:mt-2.5 leading-relaxed transition-all duration-300">
                Tunggu ya, lagi menghubungkan ulang...
              </p>
            </div>
          )}

          {/* Fase 2: Konfirmasi Offline (>= 10 Detik) dengan Desktop Scaling */}
          {isMoreThanTenSeconds && (
            <div className="mt-4 md:mt-6 max-w-sm md:max-w-md px-2 animate-in fade-in duration-200 flex flex-col items-center">
              <p className="text-xs md:text-base text-[#555555] font-medium leading-relaxed transition-all duration-300">
                Maaf banget, kayaknya kamu emang lagi offline deh.
              </p>

              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isRetrying}
                className="mt-4 md:mt-5 px-4 md:px-5 py-2 md:py-2.5 bg-[#111111] hover:bg-black text-white text-xs md:text-sm font-medium rounded-[8px] transition-all cursor-pointer disabled:opacity-50"
              >
                {isRetrying ? 'Memeriksa koneksi...' : 'Coba Hubungkan Ulang'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
