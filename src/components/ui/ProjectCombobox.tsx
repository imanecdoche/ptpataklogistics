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
}

export function ProjectCombobox({
  projects,
  selectedProjectId,
  selectedProjectName,
  onSelect,
  placeholder = 'Pilih proyek tujuan...',
  disabled = false,
  required = false,
  allowClear = true
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
    if (!query.trim()) return projects;
    const q = query.toLowerCase().trim();
    return projects.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.investorName && item.investorName.toLowerCase().includes(q))
    );
  }, [projects, query]);

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

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => !prev);
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center justify-between w-full bg-[#f5f5f5] hover:bg-[#ebebeb] focus-within:bg-[#ebebeb] rounded-[6px] px-3 py-2 text-xs transition-colors cursor-pointer border border-transparent focus-within:border-[#111111] ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
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
            className="w-full bg-transparent outline-none text-[#111111] font-semibold text-xs placeholder:text-[#888888] placeholder:font-normal"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {allowClear && (query || selectedProjectId) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#888888] hover:text-[#111111] p-0.5 rounded transition-colors"
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
            className={`w-3.5 h-3.5 text-[#666666] transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

      {/* Dropdown Popover */}
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
                  className={`px-3 py-2 cursor-pointer flex flex-col gap-0.5 border-b border-[#f5f5f5] last:border-b-0 transition-colors ${
                    isSelected ? 'bg-[#111111] text-white' : 'hover:bg-[#f5f5f5] text-[#111111]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{p.name}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'text-[#e5e5e5]' : 'text-[#666666]'
                      }`}
                    >
                      {p.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-[#e5e5e5]' : 'text-[#666666]'}>
                      Klien: <strong className="font-medium">{p.clientName}</strong>
                    </span>
                    <span className={isSelected ? 'text-[#cccccc]' : 'text-[#888888]'}>
                      Investor: {p.investorName}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
