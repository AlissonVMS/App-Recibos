import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Building2 } from 'lucide-react';
import { BACEN_PF_BANKS, formatarBancoCompe, BacenBank } from '../data/bacenBanks';

interface BacenBankSelectProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

export const BacenBankSelect: React.FC<BacenBankSelectProps> = ({
  value = '',
  onChange,
  label,
  placeholder = 'Selecione a instituição financeira...',
  required = false,
  helperText,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-foco na caixa de busca ao abrir
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtra bancos pelo código COMPE ou pelo nome da instituição
  const filteredBanks = useMemo(() => {
    if (!search.trim()) return BACEN_PF_BANKS;
    const term = search.toLowerCase().trim();
    return BACEN_PF_BANKS.filter(
      (b) =>
        b.codigo.includes(term) ||
        b.nome.toLowerCase().includes(term) ||
        b.label.toLowerCase().includes(term)
    );
  }, [search]);

  const valorFormatado = useMemo(() => {
    if (!value) return '';
    return formatarBancoCompe(value);
  }, [value]);

  const handleSelect = (bank: BacenBank) => {
    onChange(bank.label);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Botão de disparo / Display do banco selecionado */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-left text-sm rounded-lg border p-2.5 flex items-center justify-between transition-colors cursor-pointer ${
          isOpen
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20'
            : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span
            className={`truncate font-semibold ${
              valorFormatado ? 'text-slate-900' : 'text-slate-400 font-normal'
            }`}
          >
            {valorFormatado || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {helperText && (
        <span className="text-[10px] text-slate-500 mt-1 block">
          {helperText}
        </span>
      )}

      {/* Menu suspenso com caixa de busca */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100 max-w-full">
          {/* Caixa de busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por código (ex: 104) ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>
              {search.trim()
                ? `${filteredBanks.length} encontrado(s)`
                : `${BACEN_PF_BANKS.length} instituições oficiais`}
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              Padrão BACEN STR
            </span>
          </div>

          {/* Lista com scroll responsivo e ajustado */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100 text-xs overscroll-contain">
            {filteredBanks.length === 0 ? (
              <div className="py-6 px-3 text-center text-slate-400 text-xs space-y-1">
                <p className="font-semibold text-slate-600">Nenhum banco encontrado</p>
                <p className="text-[11px]">
                  Tente buscar pelo código de 3 dígitos (ex: 104, 001) ou nome.
                </p>
              </div>
            ) : (
              filteredBanks.map((b) => {
                const isSelected = valorFormatado === b.label;
                return (
                  <button
                    key={b.codigo}
                    type="button"
                    onClick={() => handleSelect(b)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-blue-200/80 text-blue-900 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.codigo}
                      </span>
                      <span className="truncate">{b.nome}</span>
                    </div>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                        <Check className="w-3 h-3" />
                        Selecionado
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
