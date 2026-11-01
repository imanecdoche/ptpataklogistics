import React, { useEffect } from 'react';
import { useDrawerTransition } from '@/hooks/useDrawerTransition';

export interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  iconSrc?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
  maxWidth?: string;
}

export function CustomDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  iconSrc,
  confirmText,
  cancelText,
  onConfirm,
  isDestructive = false,
  isLoading = false,
  maxWidth = 'max-w-md'
}: CustomDialogProps): React.JSX.Element | null {
  const { isRendered, isVisible, handleClose } = useDrawerTransition(isOpen, onClose, { durationMs: 200 });

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isLoading, handleClose]);

  if (!isRendered) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-dialog-title"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none overflow-hidden"
    >
      {/* Dimmed Backdrop (Solid Dimmed without blur per Rule 1 & 4) */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => {
          if (!isLoading) handleClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface (Solid White Card - Mobile Bottom Sheet Drawer with Smooth Transition) */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-[20px] md:rounded-[12px] max-h-[90dvh] md:max-h-[85vh] shadow-2xl overflow-hidden z-10 flex flex-col border-none transition-transform duration-200 ease-out transform ${
          isVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-4'
        }`}
      >
        {/* Header Bersih: Judul di tengah pada mobile */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#fafafa] relative flex-shrink-0 border-none">
          <div className="flex items-center justify-center md:justify-start space-x-2 min-w-0 w-full md:w-auto">
            {iconSrc && (
              <img
                src={iconSrc}
                alt=""
                className="w-4 h-4 object-contain flex-shrink-0"
              />
            )}
            <h2
              id="custom-dialog-title"
              className="text-sm font-bold tracking-tight text-[#111111] truncate text-center md:text-left w-full md:w-auto"
            >
              {title}
            </h2>
          </div>

          {/* Close Button on Desktop */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Tutup dialog"
            className="hidden md:flex p-1.5 rounded-[6px] text-[#666666] hover:text-[#111111] hover:bg-[#eeeeee] transition-colors flex-shrink-0 disabled:opacity-50 border-none cursor-pointer"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-4 h-4 object-contain"
            />
          </button>
        </div>

        {/* Content Body Scrollable */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
          {description && (
            <p className="text-xs text-[#666666] leading-relaxed text-center md:text-left whitespace-pre-line">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Sticky Bottom Action Bar */}
        {(confirmText || cancelText) ? (
          <div className="p-4 bg-white sticky bottom-0 flex-shrink-0 flex items-center justify-end space-x-2.5 z-10 border-none">
            {cancelText && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 md:flex-none px-4 py-2.5 text-xs font-semibold text-[#555555] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors disabled:opacity-50 border-none cursor-pointer whitespace-nowrap"
              >
                {cancelText}
              </button>
            )}

            {confirmText && (
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    handleClose();
                  }
                }}
                disabled={isLoading}
                className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-semibold rounded-[8px] transition-colors flex items-center justify-center space-x-2 border-none cursor-pointer whitespace-nowrap ${
                  isDestructive
                    ? 'bg-[#cf1124] hover:bg-[#a80e1d] text-white'
                    : 'bg-[#111111] hover:bg-[#2b2b2b] text-white'
                } disabled:opacity-50`}
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="md:hidden p-3.5 bg-white sticky bottom-0 flex-shrink-0 flex items-center justify-center z-10 border-none">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full py-2.5 text-xs font-semibold text-[#666666] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors border-none cursor-pointer whitespace-nowrap"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
