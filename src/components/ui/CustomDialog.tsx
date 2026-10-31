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
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none"
    >
      {/* Dimmed Backdrop with Blur (Tap on blur to close) */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface (Solid White Card - Mobile Bottom Sheet Drawer) */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-[20px] md:rounded-[10px] max-h-[92vh] md:max-h-[90vh] shadow-2xl overflow-hidden z-10 flex flex-col animate-in slide-in-from-bottom duration-300 ease-out`}
      >
        {/* Header Bersih: Judul di tengah pada mobile */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#eaeaea] relative flex-shrink-0">
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
              className="text-sm font-semibold tracking-tight text-[#111111] truncate text-center md:text-left w-full md:w-auto"
            >
              {title}
            </h2>
          </div>

          {/* Close Button on Desktop */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup dialog"
            className="hidden md:flex p-1 rounded text-[#666666] hover:text-[#111111] hover:bg-[#fafafa] transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-5 h-5 object-contain"
            />
          </button>
        </div>

        {/* Content Body Scrollable */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
          {description && (
            <p className="text-xs text-[#666666] leading-relaxed text-center md:text-left">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Sticky Bottom Action Bar */}
        {(confirmText || cancelText) ? (
          <div className="p-4 bg-white md:bg-[#fafafa] border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end space-x-2.5 z-10">
            {cancelText && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 md:flex-none px-4 py-2.5 md:py-1.5 text-xs font-semibold md:font-medium text-[#171717] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] md:rounded-[6px] transition-colors disabled:opacity-50"
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
                className={`flex-1 md:flex-none px-4 py-2.5 md:py-1.5 text-xs font-semibold md:font-medium rounded-[8px] md:rounded-[6px] transition-colors flex items-center justify-center space-x-2 ${
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
        ) : (
          <div className="md:hidden p-3.5 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-center z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-2.5 text-xs font-semibold text-[#666666] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
