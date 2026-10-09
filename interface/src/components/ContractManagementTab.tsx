import React, { useState, useEffect } from 'react';
import { Beneficiary, ContractConfig } from '../types';
import { BACEN_PF_BANKS } from '../data/bacenBanks';
import { BacenBankSelect } from './BacenBankSelect';
import {
  formatarMoeda,
  formatarNumeroMoeda,
  formatarInputMoeda,
  parseInputMoeda,
  valorPorExtenso,
} from '../utils/numberToWordsPtBr';
import {
  FileText,
  ShieldCheck,
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronsDownUp,
  Save,
  CheckCircle2,
  Users,
  AlertCircle,
} from 'lucide-react';

interface ContractManagementTabProps {
  contract: ContractConfig;
  beneficiaries: Beneficiary[];
  onSave: (
    updatedContract: ContractConfig,
    updatedBeneficiaries: Beneficiary[]
  ) => void;
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  requestConfirm?: (options: { title: string; message: string; subMessage?: string; confirmLabel: string; confirmVariant: 'emerald' | 'red' | 'amber'; onConfirm: () => void }) => void;
}

export const ContractManagementTab: React.FC<ContractManagementTabProps> = ({
  contract,
  beneficiaries,
  onSave,
  showToast,
  requestConfirm
}) => {
  const [contractForm, setContractForm] = useState<ContractConfig>({ ...contract });
  const [parties, setParties] = useState<Beneficiary[]>(() =>
    beneficiaries.map((b) => ({ ...b }))
  );
  // Controla múltiplos cards abertos simultaneamente
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(beneficiaries.map((b) => b.id))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sincroniza se os dados externos mudarem
  useEffect(() => {
    setContractForm({ ...contract });
  }, [contract]);

  useEffect(() => {
    setParties(beneficiaries.map((b) => ({ ...b })));
  }, [beneficiaries]);

  // Calcula o valor total do contrato pela soma das cotas das partes
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
      if (showToast) showToast('warning', 'Ação Bloqueada', 'O contrato deve possuir pelo menos uma parte cadastrada.');
      else alert('O contrato deve possuir pelo menos uma parte cadastrada.');
      return;
    }

    const executeDelete = () => {
      setParties((prev) => prev.filter((p) => p.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    if (requestConfirm) {
      requestConfirm({
        title: 'Remover Parte',
        message: `Deseja realmente remover a parte "${name || 'Sem Nome'}" do contrato?`,
        confirmLabel: 'Sim, Remover',
        confirmVariant: 'red',
        onConfirm: executeDelete,
      });
    } else {
      const confirmDelete = window.confirm(`Deseja realmente remover a parte "${name || 'Sem Nome'}" do contrato?`);
      if (confirmDelete) executeDelete();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    for (const p of parties) {
      if (!p.nome.trim()) {
        if (showToast) showToast('warning', 'Atenção', 'Por favor, preencha o nome de todas as partes.');
        else alert('Por favor, preencha o nome de todas as partes.');
        setExpandedIds((prev) => new Set(prev).add(p.id));
        return;
      }
      if (!p.cpf.trim()) {
        if (showToast) showToast('warning', 'Atenção', `Por favor, informe o CPF da parte "${p.nome}".`);
        else alert(`Por favor, informe o CPF da parte "${p.nome}".`);
        setExpandedIds((prev) => new Set(prev).add(p.id));
        return;
      }
    }

    onSave(contractForm, parties);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho da Aba de Contrato */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Gestão do Contrato & Partes
            </h2>
            <p className="text-xs text-slate-500">
              Configure os parâmetros do contrato, dados do pagador e o cadastro de cada parte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Alterações salvas!
            </span>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs hover:shadow-md"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: DADOS DO CONTRATO E PAGADOR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Dados do Contrato & Pagador
          </h3>
        </div>

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

          <BacenBankSelect
            label="Banco do Pagador (COMPE - Instituição)"
            required
            value={contractForm.pagadorBanco || '104 - Caixa Econômica Federal'}
            onChange={(banco) =>
              setContractForm({
                ...contractForm,
                pagadorBanco: banco,
              })
            }
            helperText="Base oficial BACEN STR. Utilizado para diferenciar transferências internas (TEV) de externas (TED)."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Título / Descrição Oficial do Contrato
            </label>
            <input
              type="text"
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

          <div className="sm:col-span-4">
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
      </div>

      {/* SEÇÃO 2: PARTES DO CONTRATO (CEDENTES / HERDEIROS) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        {/* Barra de Resumo e Toolbar de Expansão/Colapso */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Partes
              </span>
              <span className="text-xl font-black text-slate-900">
                {parties.length} Cedente{parties.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="sm:border-l sm:border-slate-200 sm:pl-6">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Valor Total do Contrato (Soma das Partes)
              </span>
              <span className="text-xl font-black text-blue-900 font-mono">
                {formatarMoeda(totalContratado)}
              </span>
            </div>
          </div>

          {/* Botões de Ação: Expandir Tudo, Recolher Tudo e Cadastrar Nova Parte */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Expandir todos os cards das partes"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
              Expandir Tudo
            </button>

            <button
              type="button"
              onClick={handleCollapseAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Recolher todos os cards das partes"
            >
              <ChevronsDownUp className="w-3.5 h-3.5 text-slate-500" />
              Recolher Tudo
            </button>

            <button
              type="button"
              onClick={handleAddParty}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Nova Parte
            </button>
          </div>
        </div>

        {/* Lista de Cards das Partes */}
        <div className="space-y-3.5">
          {parties.map((party, index) => {
            const isExpanded = expandedIds.has(party.id);

            return (
              <div
                key={party.id}
                className="bg-white border border-slate-200 rounded-xl overflow-visible shadow-xs transition-all hover:border-slate-300"
              >
                {/* Cabeçalho do Card da Parte */}
                <div
                  onClick={() => toggleParty(party.id)}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between gap-3 select-none rounded-t-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 block truncate">
                        {party.nome || 'Parte Sem Nome (Clique para preencher)'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        CPF: {party.cpf || 'Não informado'} • Cota: {formatarMoeda(party.contrato)}
                        {party.cidadeUf ? ` • ${party.cidadeUf}` : ''}
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
                      title="Excluir esta parte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Conteúdo do Formulário da Parte (Expandível) */}
                {isExpanded && (
                  <div className="p-5 space-y-4 border-t border-slate-200 bg-white animate-in fade-in duration-150">
                    {/* Linha 1: Nome e Valor da Cota */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      <div className="sm:col-span-8">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Nome Completo da Parte
                        </label>
                        <input
                          type="text"
                          value={party.nome}
                          onChange={(e) =>
                            handlePartyChange(party.id, 'nome', e.target.value)
                          }
                          placeholder="Ex: ELIANE MARIA DA SILVA"
                          className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium"
                          required
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                          Valor da Cota / Parte (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
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
                            className="w-full text-xs font-bold text-slate-900 rounded-lg border-blue-300 bg-blue-50/30 border py-2.5 pl-9 pr-3 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono text-right"
                            placeholder="0,00"
                            required
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 italic block mt-1 truncate">
                          {valorPorExtenso(party.contrato)}
                        </span>
                      </div>
                    </div>

                    {/* Linha 2: CPF e Cidade/UF */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          value={party.cpf}
                          onChange={(e) =>
                            handlePartyChange(party.id, 'cpf', e.target.value)
                          }
                          placeholder="000.000.000-00"
                          className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Cidade / UF
                        </label>
                        <input
                          type="text"
                          value={party.cidadeUf}
                          onChange={(e) =>
                            handlePartyChange(party.id, 'cidadeUf', e.target.value)
                          }
                          placeholder="Ex: Maceió - AL"
                          className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Linha 3: Dados Bancários */}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        Dados Bancários
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5">
                          <BacenBankSelect
                            label="Instituição Financeira (Banco)"
                            required
                            value={party.banco}
                            onChange={(banco) =>
                              handlePartyChange(party.id, 'banco', banco)
                            }
                            placeholder="Selecione o banco ou digite o código..."
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-500 font-medium mb-1">
                            Agência
                          </label>
                          <input
                            type="text"
                            value={party.agencia}
                            onChange={(e) =>
                              handlePartyChange(party.id, 'agencia', e.target.value)
                            }
                            placeholder="0000"
                            className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-slate-500 font-medium mb-1">
                            Conta
                          </label>
                          <input
                            type="text"
                            value={party.conta}
                            onChange={(e) =>
                              handlePartyChange(party.id, 'conta', e.target.value)
                            }
                            placeholder="00000-0"
                            className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-500 font-medium mb-1">
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
                              className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-8 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                            >
                              <option value="POUPANÇA">Poupança</option>
                              <option value="CORRENTE">Corrente</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Linha 4: Chave PIX e Tipo de Chave (Controle Interno) */}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                        Configuração do PIX (O Tipo de Chave é apenas para controle e não sai no recibo)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] text-slate-500 font-medium mb-1">
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
                              className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-8 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                            >
                              <option value="CPF">CPF</option>
                              <option value="CNPJ">CNPJ</option>
                              <option value="TELEFONE">Telefone</option>
                              <option value="E-MAIL">E-mail</option>
                              <option value="ALEATÓRIA">Chave Aleatória</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] text-slate-500 font-medium mb-1">
                            Chave PIX
                          </label>
                          <input
                            type="text"
                            value={party.chavePix}
                            onChange={(e) =>
                              handlePartyChange(party.id, 'chavePix', e.target.value)
                            }
                            placeholder="Informe a chave PIX"
                            className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
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

      {/* Barra Inferior de Ação */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
        <div className="text-xs text-slate-300">
          Total Contratado:{' '}
          <strong className="text-white text-sm font-mono ml-1">
            {formatarMoeda(totalContratado)}
          </strong>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs hover:shadow-md"
        >
          <Save className="w-4 h-4" />
          Salvar Alterações do Contrato
        </button>
      </div>

    </form>
  );
};
