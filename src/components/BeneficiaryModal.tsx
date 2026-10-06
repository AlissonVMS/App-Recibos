import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Beneficiary } from '../types';
import { formatarNumeroMoeda } from '../utils/numberToWordsPtBr';
import { X, Save, Lock, Info, Building2, ChevronDown, Search } from 'lucide-react';
import { BACEN_PF_BANKS, formatarBancoCompe } from '../data/bacenBanks';

interface BeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiary: Beneficiary | null;
  onSave: (updated: Beneficiary) => void;
}

export const BeneficiaryModal: React.FC<BeneficiaryModalProps> = ({
  isOpen,
  onClose,
  beneficiary,
  onSave,
}) => {
  if (!isOpen || !beneficiary) return null;

  const [formData, setFormData] = useState<Beneficiary>({ ...beneficiary });
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState<boolean>(false);
  const [bankSearch, setBankSearch] = useState<string>('');
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBankDropdownOpen(false);
      }
    };
    if (isBankDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBankDropdownOpen]);

  // Filtra bancos pelo código COMPE ou pelo nome da instituição
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return BACEN_PF_BANKS;
    const term = bankSearch.toLowerCase().trim();
    return BACEN_PF_BANKS.filter(
      (b) =>
        b.codigo.includes(term) ||
        b.nome.toLowerCase().includes(term) ||
        b.label.toLowerCase().includes(term)
    );
  }, [bankSearch]);

  const handleChange = (field: keyof Beneficiary, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preserva rigorosamente os valores oficiais bloqueados (Nome, CPF e Financeiro)
    onSave({
      ...formData,
      nome: beneficiary.nome,
      cpf: beneficiary.cpf,
      contrato: beneficiary.contrato,
      pago: beneficiary.pago,
      saldo: beneficiary.saldo,
      status: beneficiary.status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Editar Dados do Cedente / Beneficiário</h2>
            <p className="text-xs text-slate-300">{beneficiary.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* BLOCO BLOQUEADO: Valores Contratuais e Financeiros Calculados */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Dados Contratuais & Financeiros (Bloqueados)
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  beneficiary.status === 'QUITADO'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {beneficiary.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Contrato</span>
                <span className="font-bold text-slate-800">
                  R$ {formatarNumeroMoeda(beneficiary.contrato)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Total Pago</span>
                <span className="font-bold text-emerald-600">
                  R$ {formatarNumeroMoeda(beneficiary.pago)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Saldo Devedor</span>
                <span className="font-bold text-amber-600">
                  R$ {formatarNumeroMoeda(beneficiary.saldo)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
              <Info className="w-3 h-3 text-slate-400 shrink-0" />
              Calculado automaticamente. Alterações contratuais devem ser feitas em "Contrato".
            </p>
          </div>

          {/* IDENTIFICAÇÃO PESSOAL BLOQUEADA: Nome e CPF não podem ser alterados aqui */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span>Nome Completo</span>
                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              </label>
              <input
                type="text"
                value={beneficiary.nome}
                disabled
                className="w-full text-sm rounded-lg border-slate-200 bg-slate-100 text-slate-600 border p-2.5 cursor-not-allowed select-none font-medium"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span>CPF</span>
                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              </label>
              <input
                type="text"
                value={beneficiary.cpf}
                disabled
                className="w-full text-sm rounded-lg border-slate-200 bg-slate-100 text-slate-600 border p-2.5 cursor-not-allowed select-none font-mono"
              />
            </div>
          </div>

          {/* CAMPO EDITÁVEL: Cidade / UF */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Cidade / UF
            </label>
            <input
              type="text"
              value={formData.cidadeUf}
              onChange={(e) => handleChange('cidadeUf', e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* CAMPOS EDITÁVEIS: Dados Bancários & PIX */}
          <div className="border-t border-slate-200 pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Dados Bancários & Chave PIX
            </h3>
            <div className="space-y-3">
              <div className="relative" ref={bankDropdownRef}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Instituição Financeira (Banco) *
                </label>
                <div
                  onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 flex items-center justify-between cursor-pointer hover:border-blue-500 hover:bg-white transition-colors"
                >
                  <span className="font-semibold text-slate-900 truncate">
                    {formData.banco
                      ? formatarBancoCompe(formData.banco)
                      : 'Selecione a instituição financeira...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                </div>

                {isBankDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar por código COMPE (ex: 104) ou nome..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {filteredBanks.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-xs">
                          Nenhum banco encontrado para "{bankSearch}".
                        </div>
                      ) : (
                        filteredBanks.map((b) => (
                          <button
                            key={b.codigo}
                            type="button"
                            onClick={() => {
                              handleChange('banco', b.label);
                              setIsBankDropdownOpen(false);
                              setBankSearch('');
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between transition-colors rounded-md ${
                              formatarBancoCompe(formData.banco) === b.label
                                ? 'bg-blue-50/70 text-blue-700 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            <span className="truncate">{b.label}</span>
                            {formatarBancoCompe(formData.banco) === b.label && (
                              <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                                Selecionado
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Agência
                  </label>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => handleChange('agencia', e.target.value)}
                    className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Conta
                  </label>
                  <input
                    type="text"
                    value={formData.conta}
                    onChange={(e) => handleChange('conta', e.target.value)}
                    className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Tipo de Conta
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tipoConta}
                      onChange={(e) => handleChange('tipoConta', e.target.value as any)}
                      className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-8 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="POUPANÇA">Poupança</option>
                      <option value="CORRENTE">Corrente</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Tipo de Chave
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tipoChavePix || 'CPF'}
                      onChange={(e) => handleChange('tipoChavePix', e.target.value as any)}
                      className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-8 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="TELEFONE">Telefone</option>
                      <option value="E-MAIL">E-mail</option>
                      <option value="ALEATÓRIA">Aleatória</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={formData.chavePix}
                    onChange={(e) => handleChange('chavePix', e.target.value)}
                    className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
