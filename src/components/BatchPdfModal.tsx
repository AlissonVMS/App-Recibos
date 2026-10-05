import React, { useState } from 'react';
import { Beneficiary, ContractConfig, PaymentRecord } from '../types';
import { baixarPdfRecibo, gerarNomeArquivoRecibo } from '../utils/pdfGenerator';
import { formatarMoeda } from '../utils/numberToWordsPtBr';
import { FileText, Download, CheckCircle2, X, Filter, Printer, Loader2 } from 'lucide-react';

interface BatchPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: PaymentRecord[];
  beneficiaries: Beneficiary[];
  contract: ContractConfig;
}

export const BatchPdfModal: React.FC<BatchPdfModalProps> = ({
  isOpen,
  onClose,
  payments,
  beneficiaries,
  contract,
}) => {
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('todos');
  const [rangeInput, setRangeInput] = useState<string>('todos');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completedList, setCompletedList] = useState<string[]>([]);

  if (!isOpen) return null;

  // Filter payments according to user choices
  const parseRange = (input: string): number[] | 'todos' => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || trimmed === 'todos' || trimmed === 'all') return 'todos';

    // check comma separated or hyphen range: e.g. "1-5", "1, 2, 4"
    const result: number[] = [];
    const parts = trimmed.split(',');
    for (const part of parts) {
      const cleanPart = part.trim();
      if (cleanPart.includes('-')) {
        const [start, end] = cleanPart.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            result.push(i);
          }
        }
      } else {
        const num = Number(cleanPart);
        if (!isNaN(num)) result.push(num);
      }
    }
    return result.length > 0 ? result : 'todos';
  };

  const rangeFilter = parseRange(rangeInput);

  const filteredPayments = payments.filter((p) => {
    // Only payments already paid have official receipts issued
    if ((p.status || 'PAGO') !== 'PAGO') {
      return false;
    }
    // Beneficiary filter
    if (selectedBeneficiary !== 'todos' && p.nome !== selectedBeneficiary) {
      return false;
    }
    // Range filter
    if (rangeFilter !== 'todos' && !rangeFilter.includes(p.parcela)) {
      return false;
    }
    return true;
  });

  const handleGenerateBatch = async () => {
    if (filteredPayments.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setCompletedList([]);

    const total = filteredPayments.length;
    const completed: string[] = [];

    for (let i = 0; i < total; i++) {
      const payment = filteredPayments[i];
      // Generate and trigger download
      baixarPdfRecibo(payment, contract);
      completed.push(gerarNomeArquivoRecibo(payment));
      setProgress(Math.round(((i + 1) / total) * 100));
      // slight delay to prevent browser download popup throttling
      await new Promise((r) => setTimeout(r, 250));
    }

    setCompletedList(completed);
    setIsGenerating(false);
  };

  const handlePrintBatch = () => {
    // Print all filtered receipts
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Painel PDF • Gerar Recibos</h2>
              <p className="text-xs text-blue-100">
                Emissão em lote de recibos em conformidade com o modelo oficial
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Beneficiary Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Filtrar por Beneficiário
            </label>
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="todos">Todos os Beneficiários (Geral)</option>
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.nome}>
                  {b.nome} ({b.cpf})
                </option>
              ))}
            </select>
          </div>

          {/* Parcel Range Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Seleção de Parcelas
              </label>
              <span className="text-[11px] text-slate-400">
                Exemplos: "todos", "1-12", "9", "1, 3, 5"
              </span>
            </div>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder='Digite "todos" ou intervalo (ex: 1-12)'
              className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border p-2.5 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
            />
          </div>

          {/* Selection preview badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-700">
                Recibos selecionados para geração:
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {filteredPayments.length} recibo(s)
            </span>
          </div>

          {/* Progress bar if running */}
          {isGenerating && (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Gerando e baixando arquivos PDF...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Completed notification */}
          {completedList.length > 0 && !isGenerating && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">
                  {completedList.length} arquivos PDF gerados com sucesso!
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Os arquivos foram salvos na sua pasta de Downloads com nomes padronizados anti-sobrescrita.
                </p>
              </div>
            </div>
          )}

          {/* List preview (first 10 items) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredPayments.slice(0, 10).map((p) => (
              <div key={p.id} className="p-2.5 hover:bg-slate-50 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-mono text-[11px] font-semibold text-slate-800 block truncate">
                    {gerarNomeArquivoRecibo(p)}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Parcela {p.parcela} • {p.dia}/{p.mes}/{p.ano}
                  </span>
                </div>
                <span className="font-bold text-slate-700 shrink-0">{formatarMoeda(p.valor)}</span>
              </div>
            ))}
            {filteredPayments.length > 10 && (
              <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50">
                + {filteredPayments.length - 10} outros recibos selecionados
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBatch}
              disabled={isGenerating || filteredPayments.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Seleção
            </button>
            <button
              onClick={handleGenerateBatch}
              disabled={isGenerating || filteredPayments.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Gerar {filteredPayments.length} Recibos PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
