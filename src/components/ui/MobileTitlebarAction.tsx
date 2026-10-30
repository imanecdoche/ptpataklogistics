import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MobileTitlebarActionProps {
  children: React.ReactNode;
}

/**
 * MobileTitlebarAction (Rule 108)
 * Merender tombol aksi utama ke slot titlebar mobile di AppShell.
 * Pada viewport desktop (≥ 768px), slot target disembunyikan.
 */
export function MobileTitlebarAction({ children }: MobileTitlebarActionProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.getElementById('mobile-titlebar-action');
  if (!target) return null;

  return createPortal(children, target);
}
