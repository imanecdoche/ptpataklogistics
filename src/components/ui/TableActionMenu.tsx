import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import menuBarsIcon from '../../../assets/menu-bars.png';

export interface TableActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  hidden?: boolean;
}

interface TableActionMenuProps {
  items: TableActionMenuItem[];
  title?: string;
  align?: 'right' | 'left';
  disableRowTrigger?: boolean;
}

export function TableActionMenu({
  items,
  title = 'Opsi Aksi',
  align = 'right',
  disableRowTrigger = false
}: TableActionMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);

  const visibleItems = items.filter(item => !item.hidden);

  const updatePosition = useCallback((customPoint?: { x: number; y: number }) => {
    const menuWidth = 160;
    const menuHeight = visibleItems.length * 36 + 12;

    if (customPoint) {
      let left = customPoint.x;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (left < 8) left = 8;

      let top = customPoint.y + 4;
      if (top + menuHeight > window.innerHeight - 8) {
        top = customPoint.y - menuHeight - 4;
      }
      if (top < 8) top = 8;

      setCoords({ top, left });
      return;
    }

    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    let top = rect.bottom + 4;
    // Jika mendekati bagian bawah layar, popover dibalik ke atas
    if (top + menuHeight > window.innerHeight - 8 && rect.top > menuHeight + 8) {
      top = rect.top - menuHeight - 4;
    }

    setCoords({ top, left });
  }, [align, visibleItems.length]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Integrasi Klik Kanan (Desktop) dan Tap & Hold 500ms (Mobile) pada Baris Tabel (<tr>)
  useEffect(() => {
    if (disableRowTrigger || !buttonRef.current) return;

    const row = buttonRef.current.closest('tr');
    if (!row) return;
    activeRowRef.current = row;

    let touchTimer: ReturnType<typeof setTimeout> | null = null;
    let touchStartPos: { x: number; y: number } | null = null;

    // 1. Desktop: Klik Kanan (contextmenu)
    const handleContextMenu = (e: MouseEvent) => {
      // Abaikan jika klik terjadi di dalam input atau button lain
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, a') && !target.closest(`[data-action-menu-id]`)) {
        // Biarkan tombol asli menangani jika perlu, kecuali menu button kita
      }
      e.preventDefault();
      e.stopPropagation();
      updatePosition({ x: e.clientX, y: e.clientY });
      setIsOpen(true);
    };

    // 2. Mobile: Tap & Hold 500ms
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartPos = { x: touch.clientX, y: touch.clientY };

      touchTimer = setTimeout(() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch (_) {
            // Abaikan jika izin getar diblokir
          }
        }
        updatePosition({ x: touch.clientX, y: touch.clientY });
        setIsOpen(true);
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || !touchStartPos || !touchTimer) return;
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);

      // Jika jari bergeser > 10px (sedang scrolling), batalkan long-press
      if (dx > 10 || dy > 10) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };

    const handleTouchEnd = () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };

    row.addEventListener('contextmenu', handleContextMenu);
    row.addEventListener('touchstart', handleTouchStart, { passive: true });
    row.addEventListener('touchmove', handleTouchMove, { passive: true });
    row.addEventListener('touchend', handleTouchEnd);
    row.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      if (touchTimer) clearTimeout(touchTimer);
      row.removeEventListener('contextmenu', handleContextMenu);
      row.removeEventListener('touchstart', handleTouchStart);
      row.removeEventListener('touchmove', handleTouchMove);
      row.removeEventListener('touchend', handleTouchEnd);
      row.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disableRowTrigger, updatePosition]);

  // Highlight baris tabel yang aktif saat menu terbuka
  useEffect(() => {
    const row = activeRowRef.current;
    if (!row) return;

    if (isOpen) {
      row.classList.add('bg-[#f0f0f0]');
    } else {
      row.classList.remove('bg-[#f0f0f0]');
    }

    return () => {
      row.classList.remove('bg-[#f0f0f0]');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={title}
        data-action-menu-id="true"
        onClick={handleToggle}
        className={`w-7 h-7 inline-flex items-center justify-center rounded-[6px] transition-colors cursor-pointer select-none ${
          isOpen ? 'bg-[#eaeaea]' : 'hover:bg-[#f0f0f0] active:bg-[#e5e5e5]'
        }`}
      >
        <img
          src={menuBarsIcon}
          alt=""
          className="w-3.5 h-3.5 object-contain pointer-events-none"
        />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999
            }}
            className="w-44 bg-white border border-[#eaeaea] rounded-[8px] shadow-xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          >
            {visibleItems.map((item, index) => (
              <button
                key={index}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={e => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-[#111111] hover:bg-[#f5f5f5]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
