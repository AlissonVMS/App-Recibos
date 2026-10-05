import React, { useState, useMemo, useEffect } from 'react';
import { Beneficiary, ContractConfig, PaymentRecord } from '../types';
import { ReceiptDocument } from './ReceiptDocument';
import {
  baixarPdfRecibo,
  baixarPdfRecibosZip,
  emitirRecibos,
  gerarNomeArquivoRecibo,
  imprimirRecibosMultiplos,
} from '../utils/pdfGenerator';
import { formatarMoeda, formatarDataPtBr } from '../utils/numberToWordsPtBr';
import {
  FileText,
  Layers,
  CheckSquare,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

interface ReceiptsTabProps {
  payments: PaymentRecord[];
  beneficiaries: Beneficiary[];
  contract: ContractConfig;
  selectedReceiptPaymentId: string;
  onSelectReceiptPaymentId: (id: string) => void;
  onEditPayment?: (payment: PaymentRecord) => void;
}

export const ReceiptsTab: React.FC<ReceiptsTabProps> = ({
  payments,
  beneficiaries,
  contract,
  selectedReceiptPaymentId,
  onSelectReceiptPaymentId,
}) => {
  // Sub-aba ativa: 'individual' | 'iguais' | 'custom'
  const [subTab, setSubTab] = useState<'individual' | 'iguais' | 'custom'>('individual');

  // =========================================================================
  // REGRA DE NEGÓCIO ESTRITA:
  // Recibos só podem ser emitidos quando estiverem com o status de PAGO.
  // Recibos previstos não podem ser selecionados para emissão.
  // =========================================================================
  const paidPayments = useMemo(() => {
    return payments.filter((p) => (p.status || 'PAGO') === 'PAGO');
  }, [payments]);

  // Garante que o pagamento individual selecionado seja sempre um pagamento PAGO
  useEffect(() => {
    const isCurrentPaid = paidPayments.some((p) => p.id === selectedReceiptPaymentId);
    if (!isCurrentPaid && paidPayments.length > 0) {
      onSelectReceiptPaymentId(paidPayments[0].id);
    }
  }, [paidPayments, selectedReceiptPaymentId, onSelectReceiptPaymentId]);

  // ==========================================
  // ESTADOS PARA EMISSÃO EM LOTE: PARCELAS IGUAIS
  // ==========================================
  // Encontra os números de parcelas pagas existentes (ex: 1, 2, ..., 15)
  const availablePaidParcelNumbers = useMemo(() => {
    const nums = Array.from(new Set(paidPayments.map((p) => p.parcela)));
    nums.sort((a, b) => a - b);
    return nums;
  }, [paidPayments]);

  const [selectedParcelNumber, setSelectedParcelNumber] = useState<number>(() => {
    return availablePaidParcelNumbers.length > 0
      ? availablePaidParcelNumbers[availablePaidParcelNumbers.length - 1]
      : 13;
  });

  // Atualiza parcela selecionada se a lista de disponíveis mudar
  useEffect(() => {
    if (
      availablePaidParcelNumbers.length > 0 &&
      !availablePaidParcelNumbers.includes(selectedParcelNumber)
    ) {
      setSelectedParcelNumber(
        availablePaidParcelNumbers[availablePaidParcelNumbers.length - 1]
      );
    }
  }, [availablePaidParcelNumbers, selectedParcelNumber]);

  const matchingEqualParcelPayments = useMemo(() => {
    return paidPayments.filter((p) => p.parcela === selectedParcelNumber);
  }, [paidPayments, selectedParcelNumber]);

  // ==========================================
  // ESTADOS PARA EMISSÃO EM LOTE: SELEÇÃO CUSTOMIZADA (APENAS PAGOS)
  // ==========================================
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBeneficiary, setFilterBeneficiary] = useState<string>('todos');
  const [selectedCustomPaymentIds, setSelectedCustomPaymentIds] = useState<Set<string>>(
    () => new Set(paidPayments.map((p) => p.id))
  );

  const [isDownloadingBatch, setIsDownloadingBatch] = useState<boolean>(false);

  // Filtragem da tabela customizada (restrita a pagamentos PAGOS)
  const filteredCustomPayments = useMemo(() => {
    return paidPayments.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.includes(searchTerm) ||
        p.parcela.toString().includes(searchTerm) ||
        p.banco.toLowerCase().includes(searchTerm);
      const matchesBen = filterBeneficiary === 'todos' || p.nome === filterBeneficiary;
      return matchesSearch && matchesBen;
    });
  }, [paidPayments, searchTerm, filterBeneficiary]);

  // Ações de seleção rápida
  const handleSelectAllFiltered = () => {
    setSelectedCustomPaymentIds((prev) => {
      const next = new Set(prev);
      filteredCustomPayments.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleSelectAllPaid = () => {
    setSelectedCustomPaymentIds(new Set(paidPayments.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedCustomPaymentIds(new Set());
  };

  const toggleSelectPayment = (id: string) => {
    setSelectedCustomPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Lista selecionada atualmente (somente válidos pagos)
  const selectedPaymentsList = useMemo(() => {
    return paidPayments.filter((p) => selectedCustomPaymentIds.has(p.id));
  }, [paidPayments, selectedCustomPaymentIds]);

  const totalSelectedValue = useMemo(() => {
    return selectedPaymentsList.reduce((acc, p) => acc + p.valor, 0);
  }, [selectedPaymentsList]);

  // ==========================================
  // FUNÇÕES DE DISPARO DE DOWNLOAD / IMPRESSÃO
  // ==========================================
  // Baixa arquivos PDF separados
  const handleDownloadSeparatePdfs = async (list: PaymentRecord[]) => {
    if (list.length === 0) return;
    setIsDownloadingBatch(true);

    for (let i = 0; i < list.length; i++) {
      baixarPdfRecibo(list[i], contract);
      await new Promise((r) => setTimeout(r, 220));
    }

    setIsDownloadingBatch(false);
  };

  // Baixa lote sempre em PDFs individuais reunidos em arquivo ZIP
  const handleDownloadZip = async (
    list: PaymentRecord[],
    fileNamePrefix: string = 'RECIBOS'
  ) => {
    if (list.length === 0) return;
    setIsDownloadingBatch(true);
    const nomeZip = `${fileNamePrefix}_${list.length}_ARQUIVOS.zip`.toUpperCase();
    await baixarPdfRecibosZip(list, contract, nomeZip);
    setIsDownloadingBatch(false);
  };

  // Impressão múltipla
  const handlePrintMultiple = (list: PaymentRecord[]) => {
    if (list.length === 0) return;
    imprimirRecibosMultiplos(list, contract);
  };

  // Pagamento individual atual
  const currentIndividualPayment =
    paidPayments.find((p) => p.id === selectedReceiptPaymentId) || paidPayments[0];

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Emitir Recibo
          </h2>
          <p className="text-xs text-slate-500">
            Gere recibos oficiais 1ª VIA no padrão Microsoft Word (.docm), de forma individual ou em lote
          </p>
        </div>

        {/* Seletor de Modalidade: Individual, Parcelas Iguais, Seleção Livre */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setSubTab('individual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'individual'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Recibo Individual
          </button>

          <button
            onClick={() => setSubTab('iguais')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'iguais'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Lote: Parcelas Iguais
          </button>

          <button
            onClick={() => setSubTab('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'custom'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Lote: Credores & Parcelas Livres
          </button>
        </div>
      </div>

      {/* Regra de Validade Jurídica: Recibos Restritos a Pagamentos Efetuados */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-900 print:hidden">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Emissão Restrita a Pagamentos Quitados:</strong> Apenas parcelas com status{' '}
            <span className="font-bold text-emerald-800 uppercase">PAGO</span> estão habilitadas para emissão de recibo de quitação legal ({paidPayments.length} parcelas pagas disponíveis).
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODALIDADE: RECIBO INDIVIDUAL                                         */}
      {/* ========================================================================= */}
      {subTab === 'individual' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Selecionar Parcela Paga:
              </span>
              <div className="relative">
                <select
                  value={selectedReceiptPaymentId}
                  onChange={(e) => onSelectReceiptPaymentId(e.target.value)}
                  className="text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 pr-8 focus:bg-white focus:border-blue-500 focus:outline-hidden appearance-none"
                >
                  {paidPayments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} • Parcela nº {p.parcela} ({formatarMoeda(p.valor)}) — PAGO
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentIndividualPayment) {
                    setSelectedParcelNumber(currentIndividualPayment.parcela);
                    setSubTab('iguais');
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                Emitir esta mesma parcela para todos os credores
              </button>
            </div>
          </div>

          {currentIndividualPayment ? (
            <ReceiptDocument
              payment={currentIndividualPayment}
              contract={contract}
              onPrint={() => window.print()}
            />
          ) : (
            <div className="bg-white rounded-xl p-12 text-center text-slate-400">
              Nenhuma parcela com status PAGO disponível para emissão.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODALIDADE: LOTE POR PARCELAS IGUAIS (MESMO NÚMERO ENTRE TODOS)       */}
      {/* ========================================================================= */}
      {subTab === 'iguais' && (
        <div className="space-y-5 print:hidden">
          {/* Seletor do Número de Parcela e Ações Rápidas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Geração em Lote por Número de Parcela (Quitadas)
                </h3>
                <p className="text-xs text-slate-500">
                  Gere simultaneamente os recibos de todos os credores que já quitaram a mesma rodada/parcela
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Parcela Paga:</span>
                <div className="relative">
                  <select
                    value={selectedParcelNumber}
                    onChange={(e) => setSelectedParcelNumber(Number(e.target.value))}
                    className="text-xs font-black font-mono rounded-lg border border-blue-300 bg-blue-50/50 py-2 pl-3 pr-8 text-blue-900 focus:bg-white focus:border-blue-500 focus:outline-hidden appearance-none"
                  >
                    {availablePaidParcelNumbers.map((num) => (
                      <option key={num} value={num}>
                        Parcela nº {num} (Pagas)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Resumo da Parcela Selecionada */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recibos Pagos Encontrados para a Parcela nº {selectedParcelNumber}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {matchingEqualParcelPayments.length} Credores com pagamento confirmado • Total da Rodada:{' '}
                  <strong className="text-emerald-700 font-mono">
                    {formatarMoeda(
                      matchingEqualParcelPayments.reduce((acc, p) => acc + p.valor, 0)
                    )}
                  </strong>
                </span>
              </div>

              {/* Botões de Ação em Lote */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadZip(
                      matchingEqualParcelPayments,
                      `PARCELA_${selectedParcelNumber}`
                    )
                  }
                  disabled={matchingEqualParcelPayments.length === 0 || isDownloadingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  title="Gera um arquivo ZIP com todos os PDFs individuais da parcela"
                >
                  <Download className="w-3.5 h-3.5" />
                  Emitir Recibos em ZIP (PDFs Individuais)
                </button>

                <button
                  onClick={() => handleDownloadSeparatePdfs(matchingEqualParcelPayments)}
                  disabled={matchingEqualParcelPayments.length === 0 || isDownloadingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  title="Baixa cada recibo em arquivo PDF avulso"
                >
                  {isDownloadingBatch ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  Baixar Arquivos Separados
                </button>

                <button
                  onClick={() => handlePrintMultiple(matchingEqualParcelPayments)}
                  disabled={matchingEqualParcelPayments.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Imprimir Todos
                </button>
              </div>
            </div>

            {/* Tabela dos Credores da Parcela Selecionada */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Credor / Beneficiário</th>
                    <th className="py-2.5 px-3">CPF</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Data Efetiva</th>
                    <th className="py-2.5 px-3 text-right">Valor Quitado</th>
                    <th className="py-2.5 px-3 text-right">Saldo Restante</th>
                    <th className="py-2.5 px-3 text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {matchingEqualParcelPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Nenhum credor possui a parcela nº {selectedParcelNumber} com status PAGO.
                      </td>
                    </tr>
                  ) : (
                    matchingEqualParcelPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{p.nome}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.cpf}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            PAGO
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {formatarDataPtBr(p.dataPagamento || p.data)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">
                          {formatarMoeda(p.valor)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatarMoeda(p.saldo)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              onSelectReceiptPaymentId(p.id);
                              setSubTab('individual');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            <FileText className="w-3 h-3" />
                            Visualizar Via
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALIDADE: LOTE CUSTOMIZADO (CREDORES & PARCELAS LIVRES)              */}
      {/* ========================================================================= */}
      {subTab === 'custom' && (
        <div className="space-y-4 print:hidden">
          {/* Painel de Filtros e Busca */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  Seleção Personalizada de Recibos em Lote
                </h3>
                <p className="text-xs text-slate-500">
                  Marque livremente os recibos quitados de credores e parcelas variadas para emitir em conjunto
                </p>
              </div>

              {/* Botões de Seleção Rápida */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleSelectAllPaid}
                  className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                >
                  Marcar Todos os Recibos Pagos ({paidPayments.length})
                </button>
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  Marcar Filtrados ({filteredCustomPayments.length})
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar recibo pago por credor, CPF, parcela, banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={filterBeneficiary}
                  onChange={(e) => setFilterBeneficiary(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 focus:bg-white focus:border-blue-500 focus:outline-hidden font-medium"
                >
                  <option value="todos">Todos os Credores</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.nome}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Barra de Ação da Seleção */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm font-mono">
                {selectedCustomPaymentIds.size}
              </div>
              <div>
                <span className="text-xs font-bold block text-white">
                  {selectedCustomPaymentIds.size} recibos quitados selecionados
                </span>
                <span className="text-[11px] text-slate-300 font-mono">
                  Soma total: {formatarMoeda(totalSelectedValue)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  handleDownloadZip(
                    selectedPaymentsList,
                    'RECIBOS_SELECIONADOS'
                  )
                }
                disabled={selectedPaymentsList.length === 0 || isDownloadingBatch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Emitir Recibos em ZIP ({selectedPaymentsList.length} PDFs)
              </button>

              <button
                onClick={() => handleDownloadSeparatePdfs(selectedPaymentsList)}
                disabled={selectedPaymentsList.length === 0 || isDownloadingBatch}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40"
              >
                {isDownloadingBatch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Baixar Arquivos Separados
              </button>

              <button
                onClick={() => handlePrintMultiple(selectedPaymentsList)}
                disabled={selectedPaymentsList.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Tabela de Seleção Customizada */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredCustomPayments.length > 0 &&
                          filteredCustomPayments.every((p) =>
                            selectedCustomPaymentIds.has(p.id)
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAllFiltered();
                          } else {
                            setSelectedCustomPaymentIds((prev) => {
                              const next = new Set(prev);
                              filteredCustomPayments.forEach((p) => next.delete(p.id));
                              return next;
                            });
                          }
                        }}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-semibold">Credor / Beneficiário</th>
                    <th className="py-2.5 px-2 text-center font-semibold">Parcela</th>
                    <th className="py-2.5 px-2 text-center font-semibold">Status</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Data Pgto</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Valor</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Saldo Restante</th>
                    <th className="py-2.5 px-3 font-semibold">Forma / Chave</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredCustomPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Nenhum registro pago encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomPayments.map((p) => {
                      const isSelected = selectedCustomPaymentIds.has(p.id);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => toggleSelectPayment(p.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectPayment(p.id)}
                              className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{p.nome}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              CPF: {p.cpf}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-800">
                            nº {p.parcela}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              PAGO
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {formatarDataPtBr(p.dataPagamento || p.data)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">
                            {formatarMoeda(p.valor)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatarMoeda(p.saldo)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] font-semibold text-slate-700 block">
                              {p.formaPgto}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 truncate block max-w-[150px]">
                              {p.chave}
                            </span>
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                onSelectReceiptPaymentId(p.id);
                                setSubTab('individual');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Ver Via
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
