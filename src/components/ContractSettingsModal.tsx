import React, { useState } from 'react';
import { Beneficiary, ContractConfig } from '../types';
import { BACEN_PF_BANKS } from '../data/bacenBanks';
import {
  formatarNumeroMoeda,
  formatarInputMoeda,
  parseInputMoeda,
} from '../utils/numberToWordsPtBr';
import {
  X,
  Save,
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronsDownUp,
  FileText,
} from 'lucide-react';

interface ContractSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractConfig;
  beneficiaries: Beneficiary[];
  onSave: (
    updatedContract: ContractConfig,
    updatedBeneficiaries: Beneficiary[]
  ) => void;
}

export const ContractSettingsModal: React.FC<ContractSettingsModalProps> = ({
  isOpen,
  onClose,
  contract,
  beneficiaries,
  onSave,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'contrato' | 'partes'>('partes');
  const [contractForm, setContractForm] = useState<ContractConfig>({ ...contract });
  const [parties, setParties] = useState<Beneficiary[]>(() =>
    beneficiaries.map((b) => ({ ...b }))
  );
  // Controla expansão individual e em lote (Expandir Tudo / Recolher Tudo)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(beneficiaries.map((b) => b.id))
  );

  // Calcula o valor total do contrato somando as cotas de cada parte
  const totalContratado = parties.reduce(
    (acc, p) => acc + (Number(p.contrato) || 0),
    0
  );

  const handleExpandAll = () => {
    setExpandedIds(new Set(parties.map((p) => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const toggleParty = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePartyChange = (id: string, field: keyof Beneficiary, value: any) => {
    setParties((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            [field]: value,
          };
        }
        return p;
      })
    );
  };

  const handleAddParty = () => {
    const newId = `ben-${Date.now()}`;
    const newParty: Beneficiary = {
      id: newId,
      nome: '',
      cpf: '',
      contrato: 30000,
      pago: 0,
      saldo: 30000,
      status: 'EM ABERTO',
      banco: '',
      agencia: '',
      conta: '',
      operacao: '',
      tipoConta: 'CORRENTE',
      chavePix: '',
      tipoChavePix: 'CPF',
      cidadeUf: '',
    };
    setParties((prev) => [...prev, newParty]);
    setExpandedIds((prev) => new Set(prev).add(newId));
  };

  const handleRemoveParty = (id: string, name: string) => {
    if (parties.length <= 1) {
      alert('O contrato deve possuir pelo menos uma parte cadastrada.');
      return;
    }
    const confirmDelete = window.confirm(
      `Deseja realmente remover a parte "${name || 'Sem Nome'}" do contrato?`
    );
    if (confirmDelete) {
      setParties((prev) => prev.filter((p) => p.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas das partes
    for (const p of parties) {
      if (!p.nome.trim()) {
        alert('Por favor, informe o nome de todas as partes do contrato.');
        setActiveTab('partes');
        setExpandedIds((prev) => new Set(prev).add(p.id));
        return;
      }
      if (!p.cpf.trim()) {
        alert(`Por favor, informe o CPF da parte "${p.nome}".`);
        setActiveTab('partes');
        setExpandedIds((prev) => new Set(prev).add(p.id));
        return;
      }
    }

    onSave(contractForm, parties);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header do Modal */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Gestão do Contrato & Partes</h2>
              <p className="text-xs text-slate-300">
                Configure os parâmetros do contrato, dados do pagador e cadastro de cada parte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação Interna */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('partes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'partes'
                ? 'bg-white text-blue-600 border-slate-200 -mb-px'
                : 'text-slate-500 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Partes do Contrato ({parties.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contrato')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'contrato'
                ? 'bg-white text-blue-600 border-slate-200 -mb-px'
                : 'text-slate-500 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Dados do Contrato & Pagador
          </button>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* ============================================================== */}
          {/* ABA 1: PARTES DO CONTRATO (CADASTRO COMPLETO)                  */}
          {/* ============================================================== */}
          {activeTab === 'partes' && (
            <div className="space-y-4">
              {/* Barra de Resumo das Partes e Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl gap-3">
                <div>
                  <span className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                    Valor Total do Contrato (Soma das Partes)
                  </span>
                  <span className="text-xl font-black text-blue-900 font-mono">
                    R$ {formatarNumeroMoeda(totalContratado)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                    title="Expandir todos os cards"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
                    Expandir Tudo
                  </button>

                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                    title="Recolher todos os cards"
                  >
                    <ChevronsDownUp className="w-3.5 h-3.5 text-slate-500" />
                    Recolher Tudo
                  </button>

                  <button
                    type="button"
                    onClick={handleAddParty}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Parte
                  </button>
                </div>
              </div>

              {/* Lista de Partes Cadastradas */}
              <div className="space-y-3">
                {parties.map((party, index) => {
                  const isExpanded = expandedIds.has(party.id);

                  return (
                    <div
                      key={party.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all"
                    >
                      {/* Cabeçalho do Card da Parte */}
                      <div
                        onClick={() => toggleParty(party.id)}
                        className="p-3.5 bg-slate-50/80 hover:bg-slate-100/60 cursor-pointer flex items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">
                              {party.nome || 'Parte Sem Nome'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              CPF: {party.cpf || 'Não informado'} • Cota: R${' '}
                              {formatarNumeroMoeda(party.contrato)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveParty(party.id, party.nome);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover parte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Corpo do Formulário da Parte (Expandível) */}
                      {isExpanded && (
                        <div className="p-4 space-y-3.5 border-t border-slate-200 bg-white">
                          {/* Linha 1: Nome e Valor da Cota */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-8">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Nome Completo
                              </label>
                              <input
                                type="text"
                                value={party.nome}
                                onChange={(e) =>
                                  handlePartyChange(party.id, 'nome', e.target.value)
                                }
                                placeholder="Nome completo da parte"
                                className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">
                                Valor da Cota (R$)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold">
                                  R$
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatarInputMoeda(party.contrato)}
                                  onChange={(e) =>
                                    handlePartyChange(
                                      party.id,
                                      'contrato',
                                      parseInputMoeda(e.target.value)
                                    )
                                  }
                                  className="w-full text-xs font-bold text-slate-900 rounded-lg border-blue-300 bg-blue-50/30 border py-2 pl-8 pr-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono text-right"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* Linha 2: CPF e Cidade/UF */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                CPF
                              </label>
                              <input
                                type="text"
                                value={party.cpf}
                                onChange={(e) =>
                                  handlePartyChange(party.id, 'cpf', e.target.value)
                                }
                                placeholder="000.000.000-00"
                                className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Cidade / UF
                              </label>
                              <input
                                type="text"
                                value={party.cidadeUf}
                                onChange={(e) =>
                                  handlePartyChange(
                                    party.id,
                                    'cidadeUf',
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: Maceió - AL"
                                className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>

                          {/* Linha 3: Dados Bancários */}
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-blue-500" />
                              Dados Bancários
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-5">
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                                  Banco
                                </label>
                                <input
                                  type="text"
                                  value={party.banco}
                                  onChange={(e) =>
                                    handlePartyChange(party.id, 'banco', e.target.value)
                                  }
                                  placeholder="Ex: Caixa Econômica"
                                  className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                                  Agência
                                </label>
                                <input
                                  type="text"
                                  value={party.agencia}
                                  onChange={(e) =>
                                    handlePartyChange(
                                      party.id,
                                      'agencia',
                                      e.target.value
                                    )
                                  }
                                  placeholder="0000"
                                  className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                                  Conta
                                </label>
                                <input
                                  type="text"
                                  value={party.conta}
                                  onChange={(e) =>
                                    handlePartyChange(party.id, 'conta', e.target.value)
                                  }
                                  placeholder="00000-0"
                                  className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                                  Tipo Conta
                                </label>
                                <div className="relative">
                                  <select
                                    value={party.tipoConta}
                                    onChange={(e) =>
                                      handlePartyChange(
                                        party.id,
                                        'tipoConta',
                                        e.target.value as any
                                      )
                                    }
                                    className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 pr-7 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                                  >
                                    <option value="POUPANÇA">Poupança</option>
                                    <option value="CORRENTE">Corrente</option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Linha 4: Chave PIX e Tipo de Chave (Controle Interno) */}
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Configuração do PIX (O Tipo de Chave é apenas para controle e não sai no recibo)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                                  Tipo de Chave (Controle)
                                </label>
                                <div className="relative">
                                  <select
                                    value={party.tipoChavePix || 'CPF'}
                                    onChange={(e) =>
                                      handlePartyChange(
                                        party.id,
                                        'tipoChavePix',
                                        e.target.value as any
                                      )
                                    }
                                    className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 pr-7 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                                  >
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="TELEFONE">Telefone</option>
                                    <option value="E-MAIL">E-mail</option>
                                    <option value="ALEATÓRIA">Chave Aleatória</option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                                </div>
                              </div>
                              <div className="sm:col-span-8">
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                                  Chave PIX
                                </label>
                                <input
                                  type="text"
                                  value={party.chavePix}
                                  onChange={(e) =>
                                    handlePartyChange(
                                      party.id,
                                      'chavePix',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Chave PIX da parte"
                                  className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 2: DADOS DO CONTRATO & PAGADOR                             */}
          {/* ============================================================== */}
          {activeTab === 'contrato' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Nome do Pagador / Contratante *
                  </label>
                  <input
                    type="text"
                    value={contractForm.pagadorNome}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        pagadorNome: e.target.value,
                      })
                    }
                    className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    CPF do Pagador *
                  </label>
                  <input
                    type="text"
                    value={contractForm.pagadorCpf}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        pagadorCpf: e.target.value,
                      })
                    }
                    className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Banco do Pagador (COMPE - Instituição) *
                  </label>
                  <div className="relative">
                    <select
                      value={contractForm.pagadorBanco || '104 - Caixa Econômica Federal'}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          pagadorBanco: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold text-slate-900 rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-8 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 appearance-none truncate"
                      required
                    >
                      {BACEN_PF_BANKS.map((b) => (
                        <option key={b.codigo} value={b.label}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Base oficial BACEN STR. Utilizado para diferenciar transferências internas (TEV) de externas (TED).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Título / Descrição Oficial do Contrato
                </label>
                <textarea
                  rows={3}
                  value={contractForm.tituloContrato}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      tituloContrato: e.target.value,
                    })
                  }
                  className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Data de Assinatura do Contrato
                </label>
                <input
                  type="date"
                  value={contractForm.dataContrato}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      dataContrato: e.target.value,
                    })
                  }
                  className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Rodapé de Ações */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Total Contratado: <strong>R$ {formatarNumeroMoeda(totalContratado)}</strong>
            </span>

            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
};
