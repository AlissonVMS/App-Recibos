import React, { useState, useMemo } from 'react';
import { ContractConfig, PaymentRecord } from '../types';
import { ReceiptDocument } from './ReceiptDocument';
import {
  baixarPdfRecibo,
  baixarPdfRecibosZip,
  gerarNomeArquivoLote,
  gerarNomeArquivoRecibo,
  imprimirRecibosMultiplos,
} from '../utils/pdfGenerator';
import { formatarMoeda, formatarDataPtBr } from '../utils/numberToWordsPtBr';
import {
  X,
  Download,
  Printer,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Archive,
  Loader2,
  Clock,
} from 'lucide-react';

interface ReceiptsBatchPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayments: PaymentRecord[];
  contract: ContractConfig;
}

export const ReceiptsBatchPreviewModal: React.FC<ReceiptsBatchPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedPayments,
  contract,
}) => {
  // Filtro interno e implícito na regra de negócio:
  // Apenas pagamentos com status PAGO geram recibo oficial
  const paidPayments = useMemo(() => {
    return selectedPayments.filter((p) => (p.status || 'PAGO') === 'PAGO');
  }, [selectedPayments]);

  const plannedPayments = useMemo(() => {
    return selectedPayments.filter((p) => p.status === 'PREVISTO');
  }, [selectedPayments]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Nome do arquivo gerado conforme regra padronizada inteligente
  const suggestedFileName = useMemo(() => {
    if (paidPayments.length === 0) return 'RECIBOS.zip';
    if (paidPayments.length === 1) {
      return gerarNomeArquivoRecibo(paidPayments[0]);
    }
    return gerarNomeArquivoLote(paidPayments);
  }, [paidPayments]);

  const totalPaidValue = useMemo(() => {
    return paidPayments.reduce((acc, p) => acc + p.valor, 0);
  }, [paidPayments]);

  if (!isOpen) return null;

  const currentPayment = paidPayments[currentIndex] || paidPayments[0];

  const handleNext = () => {
    if (currentIndex < paidPayments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDownloadAll = async () => {
    if (paidPayments.length === 0) return;
    setIsGenerating(true);
    try {
      if (paidPayments.length === 1) {
        baixarPdfRecibo(paidPayments[0], contract);
      } else {
        await baixarPdfRecibosZip(paidPayments, contract, suggestedFileName);
      }
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintAll = () => {
    if (paidPayments.length === 0) return;
    imprimirRecibosMultiplos(paidPayments, contract);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header do Modal */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Conferência de Recibos antes da Emissão
                <span className="text-xs font-normal text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/20">
                  {paidPayments.length} Recibo{paidPayments.length > 1 ? 's' : ''} Pronto{paidPayments.length > 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Revise o conteúdo de cada recibo nesta tela antes de confirmar o download
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Aviso de Previstos e Barra de Resumo */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3 bg-slate-50 shrink-0">
          {/* AVISO LEGAL: Caso itens PREVISTOS tenham sido marcados */}
          {plannedPayments.length > 0 && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  Atenção: {selectedPayments.length} itens foram selecionados (incluindo {plannedPayments.length} com status PREVISTO)
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Conforme a regra jurídica do contrato, <strong>apenas as parcelas com pagamento confirmado (status PAGO) geram recibo de quitação plena</strong>. As {plannedPayments.length} parcelas previstas ({plannedPayments.map((p) => `${p.nome} - P${p.parcela}`).join(', ')}) foram desconsideradas para esta emissão.
                </p>
                <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Total habilitado para emissão: {paidPayments.length} recibos quitados.
                </p>
              </div>
            </div>
          )}

          {/* Barra de Informações do Arquivo e Pagamentos */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
            <div className="sm:col-span-8 bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Arquivo a ser gerado ({paidPayments.length > 1 ? 'Pacote ZIP com PDFs individuais' : 'PDF Individual'})
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs truncate block select-all">
                  {suggestedFileName}
                </span>
              </div>
            </div>

            <div className="sm:col-span-4 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Soma Total Quitada
                </span>
                <span className="font-mono font-black text-emerald-700 text-sm block">
                  {formatarMoeda(totalPaidValue)}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {paidPayments.length} {paidPayments.length > 1 ? 'vias' : 'via'}
              </span>
            </div>
          </div>
        </div>

        {/* Área Central: Lista à Esquerda e Visualizador A4 à Direita */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Coluna Esquerda: Lista dos Recibos no Lote */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/70 overflow-y-auto max-h-[35vh] md:max-h-none shrink-0 divide-y divide-slate-200/80">
            <div className="p-3 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 text-xs flex items-center justify-between sticky top-0 z-10">
              <span>Recibos a Emitir ({paidPayments.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Clique para inspecionar
              </span>
            </div>

            {paidPayments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhuma parcela com status PAGO selecionada.
              </div>
            ) : (
              paidPayments.map((p, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-blue-50/90 border-l-4 border-blue-600 text-blue-900'
                        : 'hover:bg-slate-100/70 text-slate-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 font-mono mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate block">
                          {p.nome}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-700 shrink-0">
                          P{p.parcela}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono font-semibold text-slate-700">
                          {formatarMoeda(p.valor)}
                        </span>
                        <span className="font-mono text-[10px]">
                          {formatarDataPtBr(p.dataPagamento || p.data)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Coluna Direita: Visualizador da Folha Oficial A4 */}
          <div className="flex-1 bg-slate-200/70 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
            {paidPayments.length > 0 && currentPayment ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* Controles de Navegação entre Recibos */}
                <div className="w-full max-w-[210mm] flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-300/80 shadow-xs">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  <span className="text-xs font-bold text-slate-800">
                    Recibo {currentIndex + 1} de {paidPayments.length} •{' '}
                    <span className="text-blue-700">{currentPayment.nome}</span> (Parcela nº {currentPayment.parcela})
                  </span>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === paidPayments.length - 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Exibição da Folha A4 do Recibo */}
                <ReceiptDocument
                  payment={currentPayment}
                  contract={contract}
                  onPrint={() => window.print()}
                />
              </div>
            ) : (
              <div className="m-auto text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm max-w-md">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Nenhum recibo quitado para exibir</p>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione parcelas com status PAGO na tabela para poder visualizá-las e emitir os recibos correspondentes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer com Botões de Ação Final */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-300">
            {paidPayments.length > 1 ? (
              <span>
                Será gerado <strong>1 arquivo ZIP</strong> contendo <strong>{paidPayments.length} arquivos PDF individuais</strong>.
              </span>
            ) : paidPayments.length === 1 ? (
              <span>Será baixado <strong>1 arquivo PDF individual</strong>.</span>
            ) : (
              <span>Nenhum recibo válido para download.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            {paidPayments.length > 0 && (
              <button
                onClick={handlePrintAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Todos
              </button>
            )}

            <button
              onClick={handleDownloadAll}
              disabled={paidPayments.length === 0 || isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {paidPayments.length > 1
                ? `Confirmar e Baixar Todos em ZIP (${paidPayments.length} PDFs)`
                : paidPayments.length === 1
                ? 'Confirmar e Baixar Recibo em PDF'
                : 'Nenhum Recibo a Emitir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
