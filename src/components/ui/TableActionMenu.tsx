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
}

export function TableActionMenu({
  items,
  title = 'Opsi Aksi',
  align = 'right'
}: TableActionMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = items.filter(item => !item.hidden);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = visibleItems.length * 36 + 12;

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
            className="w-40 bg-white border border-[#eaeaea] rounded-[8px] shadow-lg py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
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
