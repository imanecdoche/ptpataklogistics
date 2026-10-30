import React, { useEffect } from 'react';

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
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Solid Dimmed Backdrop (Tanpa Blur / Anti-Glassmorphism) */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface (Solid White Card - Borderless) */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-[10px] shadow-2xl overflow-hidden z-10 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaeaea]">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            {iconSrc && (
              <img
                src={iconSrc}
                alt=""
                className="w-4 h-4 object-contain flex-shrink-0"
              />
            )}
            <h2
              id="custom-dialog-title"
              className="text-sm font-semibold tracking-tight text-[#111111] truncate"
            >
              {title}
            </h2>
          </div>

          {/* Close Button (Wajib menggunakan /icons/close.png) */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup dialog"
            className="p-1 rounded text-[#666666] hover:text-[#111111] hover:bg-[#fafafa] transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-5 h-5 object-contain"
            />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-4 space-y-3">
          {description && (
            <p className="text-xs text-[#666666] leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Action Buttons Footer (Jika ada tombol aksi) */}
        {(confirmText || cancelText) && (
          <div className="px-5 py-3 bg-[#fafafa] border-t border-[#eaeaea] flex items-center justify-end space-x-2">
            {cancelText && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[6px] transition-colors disabled:opacity-50"
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
                    onClose();
                  }
                }}
                disabled={isLoading}
                className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors flex items-center justify-center space-x-2 ${
                  isDestructive
                    ? 'bg-[#cf1124] hover:bg-[#a80e1d] text-white'
                    : 'bg-[#171717] hover:bg-[#333333] text-white'
                } disabled:opacity-50`}
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
