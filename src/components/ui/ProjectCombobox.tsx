import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project } from '@/types/database';

interface ProjectComboboxProps {
  projects: Project[];
  selectedProjectId?: string;
  selectedProjectName?: string;
  onSelect: (project: Project | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  variant?: 'default' | 'solid-white';
  activeOnly?: boolean;
}

export function ProjectCombobox({
  projects,
  selectedProjectId,
  selectedProjectName,
  onSelect,
  placeholder = 'Pilih proyek tujuan...',
  disabled = false,
  required = false,
  allowClear = true,
  variant = 'default',
  activeOnly = true
}: ProjectComboboxProps): React.JSX.Element {
  const [query, setQuery] = useState(selectedProjectName || '');
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedProjectName !== undefined) {
      setQuery(selectedProjectName);
    } else if (selectedProjectId) {
      const p = projects.find(item => item.id === selectedProjectId);
      if (p) setQuery(p.name);
    } else {
      setQuery('');
    }
  }, [selectedProjectId, selectedProjectName, projects]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedProjectName && query !== selectedProjectName) {
          setQuery(selectedProjectName);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProjectName, query]);

  const filteredProjects = useMemo(() => {
    const list = activeOnly !== false
      ? projects.filter(item => item.status === 'ACTIVE')
      : projects;
    if (!query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.clientName && item.clientName.toLowerCase().includes(q))
    );
  }, [projects, query, activeOnly]);

  const handleSelect = (p: Project): void => {
    setQuery(p.name);
    setIsOpen(false);
    onSelect(p);
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setQuery('');
    onSelect(null);
    inputRef.current?.focus();
  };

  const isSolidWhite = variant === 'solid-white';

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => !prev);
            inputRef.current?.focus();
          }
        }}
        className={`relative flex items-center justify-between w-full rounded-[6px] pl-9 pr-3 py-2 text-xs transition-colors cursor-pointer ${
          isSolidWhite
            ? 'bg-white border-none text-black font-semibold'
            : 'bg-[#f5f5f5] hover:bg-[#ebebeb] focus-within:bg-[#ebebeb] text-[#111111] border border-transparent focus-within:border-[#111111]'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <img
          src="/icons/search.png"
          alt="Search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
        />
        <div className="flex-1 min-w-0 pr-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            required={required && !selectedProjectId}
            placeholder={placeholder}
            onChange={e => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            className={`w-full bg-transparent outline-none text-xs placeholder:font-normal ${
              isSolidWhite
                ? 'text-black font-semibold placeholder:text-[#888888]'
                : 'text-[#111111] font-semibold placeholder:text-[#888888]'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {allowClear && (query || selectedProjectId) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={`${
                isSolidWhite ? 'text-black hover:text-red-600' : 'text-[#888888] hover:text-[#111111]'
              } p-0.5 rounded transition-colors`}
              title="Bersihkan pilihan"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          <svg
            className={`w-3.5 h-3.5 transition-transform ${
              isSolidWhite ? 'text-black' : 'text-[#666666]'
            } ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown Popover: Hanya nama proyek saja per Rule 89 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#eaeaea] rounded-[8px] shadow-lg py-1 text-xs">
          {filteredProjects.length === 0 ? (
            <div className="px-3 py-3 text-center text-[#888888]">
              Tidak ada proyek yang cocok dengan "{query}".
            </div>
          ) : (
            filteredProjects.map(p => {
              const isSelected = p.id === selectedProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between border-b border-[#f5f5f5] last:border-b-0 transition-colors ${
                    isSelected ? 'bg-[#111111] text-white font-bold' : 'hover:bg-[#f5f5f5] text-[#111111] font-semibold'
                  }`}
                >
                  <span className="truncate text-xs">{p.name}</span>
                  {isSelected && <span className="text-[10px] text-white font-mono">✓</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
