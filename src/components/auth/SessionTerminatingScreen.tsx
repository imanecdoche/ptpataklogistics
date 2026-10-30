import React from 'react';
import logoutGif from '../../../assets/logout-square-arrow.gif';

interface SessionTerminatingScreenProps {
  isFadingOut?: boolean;
}

export function SessionTerminatingScreen({
  isFadingOut = false
}: SessionTerminatingScreenProps): React.JSX.Element {
  return (
    <div
      aria-live="polite"
      className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center select-none h-dvh max-h-dvh w-full overflow-hidden transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Logout GIF Icon di Tengah Layar dengan Desktop Scaling */}
      <img
        src={logoutGif}
        alt=""
        className="w-12 h-12 md:w-20 md:h-20 object-contain pointer-events-none transition-all duration-300"
      />

      {/* Teks Status Pemutusan Sesi dengan Desktop Scaling */}
      <span className="text-xs md:text-sm text-[#888888] font-normal mt-3.5 md:mt-4 tracking-normal transition-all duration-300">
        Memutuskan sesi, harap tunggu...
      </span>
    </div>
  );
}
