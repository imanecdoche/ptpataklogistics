import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FlexibleTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onSubmitShortcut?: () => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  variant?: 'default' | 'solid-white';
}

const LINE_HEIGHT = 18; // px per line
const PADDING_VERTICAL = 16; // 8px top + 8px bottom (py-2)
const MIN_HEIGHT = LINE_HEIGHT + PADDING_VERTICAL; // 1 line: ~34px
const MAX_AUTO_HEIGHT = LINE_HEIGHT * 4 + PADDING_VERTICAL; // 4 lines: ~88px

export function FlexibleTextarea({
  value,
  onChange,
  placeholder = 'Catatan tambahan...',
  onSubmitShortcut,
  required = false,
  disabled = false,
  id,
  variant = 'default'
}: FlexibleTextareaProps): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [manualHeight, setManualHeight] = useState<number | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Periksa posisi scroll untuk memicu fading edge
  const updateScrollState = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 2);
    setCanScrollDown(scrollHeight - scrollTop - clientHeight > 2);
  }, []);

  // Hitung tinggi otomatis (1 baris s/d 4 baris) atau terapkan tinggi manual hasil tarikan
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (manualHeight !== null) {
      el.style.height = `${manualHeight}px`;
      setHasOverflow(el.scrollHeight > manualHeight + 2);
      updateScrollState();
      return;
    }

    // Reset height ke auto sementara untuk mengukur scrollHeight yang presisi
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;

    // Default: 1 line (MIN_HEIGHT), membesar otomatis hingga 4 line (MAX_AUTO_HEIGHT)
    const targetHeight = Math.min(Math.max(scrollH, MIN_HEIGHT), MAX_AUTO_HEIGHT);
    el.style.height = `${targetHeight}px`;

    const overflowed = scrollH > MAX_AUTO_HEIGHT + 2;
    setHasOverflow(overflowed);
    updateScrollState();
  }, [manualHeight, updateScrollState]);

  useEffect(() => {
    adjustHeight();
  }, [value, manualHeight, adjustHeight]);

  // Handle Dragging / Resizing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;

    const startY = e.clientY;
    const startH = el.getBoundingClientRect().height;

    const onMouseMove = (moveEvent: MouseEvent): void => {
      const deltaY = moveEvent.clientY - startY;
      // Batas minimum tarikan manual tidak boleh lebih kecil dari 4 baris (MAX_AUTO_HEIGHT)
      const nextH = Math.max(startH + deltaY, MAX_AUTO_HEIGHT);
      setManualHeight(nextH);
    };

    const onMouseUp = (): void => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Double click pada garis handler untuk reset kembali ke mode otomatis adaptif
  const handleReset = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setManualHeight(null);
  };

  // Shortcut tombol keyboard: Enter = newline, Ctrl/Cmd+Enter = submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmitShortcut?.();
    }
  };

  const showHandle = hasOverflow || manualHeight !== null;
  const fadeBgClass = variant === 'solid-white'
    ? 'from-white'
    : isFocused ? 'from-[#ebebeb]' : 'from-[#f5f5f5]';

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[6px] transition-colors flex flex-col group ${
        variant === 'solid-white'
          ? 'bg-white border-2 border-black'
          : 'bg-[#f5f5f5] focus-within:bg-[#ebebeb]'
      }`}
    >
      {/* Top Fading Edge (Muncul saat user men-scroll teks ke bawah) */}
      {canScrollUp && (
        <div
          className={`absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-b ${fadeBgClass} to-transparent pointer-events-none rounded-t-[6px] z-10 transition-colors`}
        />
      )}

      {/* Textarea Input */}
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={updateScrollState}
        onFocus={() => {
          setIsFocused(true);
          updateScrollState();
        }}
        onBlur={() => {
          setIsFocused(false);
          updateScrollState();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={1}
        className={`w-full bg-transparent outline-none px-3 py-2 text-xs resize-none overflow-y-auto font-sans leading-[18px] transition-[height] duration-75 ${
          variant === 'solid-white'
            ? 'text-black font-semibold placeholder:text-[#888888]'
            : 'text-[#111111] placeholder:text-[#999999]'
        }`}
        style={{
          minHeight: `${MIN_HEIGHT}px`
        }}
      />

      {/* Bottom Fading Edge (Muncul saat ada teks di bawah yang terpotong/bisa discroll) */}
      {canScrollDown && (
        <div
          className={`absolute ${
            showHandle ? 'bottom-3.5' : 'bottom-0'
          } left-0 right-0 h-4 bg-gradient-to-t ${fadeBgClass} to-transparent pointer-events-none z-10 transition-colors`}
        />
      )}

      {/* Drag Handler (Garis pendek horizontal di tengah bawah, kondisional jika > 4 baris atau di-resize manual) */}
      {showHandle && (
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleReset}
          title="Tarik ke bawah untuk memperbesar, double-click untuk reset tinggi"
          className="w-full flex items-center justify-center py-1 cursor-row-resize select-none border-t border-black/[0.04]"
        >
          <div className="w-8 h-1 rounded-full bg-[#cccccc] group-hover:bg-[#aaaaaa] transition-colors" />
        </div>
      )}
    </div>
  );
}
