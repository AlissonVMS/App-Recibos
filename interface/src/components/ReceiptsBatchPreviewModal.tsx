import React, { useState, useEffect, useMemo } from 'react';
import { ContractConfig, PaymentRecord } from '../types';
import { ReceiptDocument } from './ReceiptDocument';
import {
  baixarPdfRecibo,
  baixarPdfRecibosZip,
  gerarNomeArquivoLote,
  gerarNomeArquivoRecibo,
} from '../utils/pdfGenerator';
import { imprimirLoteRecibos, imprimirElementoRecibo } from '../utils/printHelper';
import { formatarMoeda, formatarDataPtBr } from '../utils/numberToWordsPtBr';
import {
  X,
  Download,
  Printer,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  Archive,
  Loader2,
  ArrowLeft,
  Check,
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

  // Tecla ESC fecha a conferência e volta ao registro de pagamentos
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    imprimirLoteRecibos(paidPayments, contract);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150">
      {/* Topbar Full Width - Tema Claro consistente com a janela principal */}
      <header className="bg-white border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold"
            title="Voltar ao Registro de Pagamentos (ou pressione ESC)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
            <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                Conferência de Recibos
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {paidPayments.length} {paidPayments.length === 1 ? 'Recibo' : 'Recibos'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Espaço integral de visualização: confira o teor de cada via antes da emissão definitiva
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {paidPayments.length > 0 && (
            <button
              onClick={handlePrintAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
              title="Imprimir todos os recibos"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Imprimir Todos</span>
            </button>
          )}

          <button
            onClick={handleDownloadAll}
            disabled={paidPayments.length === 0 || isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {paidPayments.length > 1
                ? `Baixar Tudo em ZIP (${paidPayments.length} PDFs)`
                : paidPayments.length === 1
                ? 'Baixar Recibo em PDF'
                : 'Nenhum Recibo'}
            </span>
          </button>
        </div>
      </header>

      {/* Faixa de Aviso Informativo se houver itens previstos na seleção */}
      {plannedPayments.length > 0 && (
        <div className="bg-blue-50/80 border-b border-blue-200/90 px-4 sm:px-6 py-2.5 text-blue-900 text-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Aviso Informativo:</strong> Foram marcados {selectedPayments.length} itens no total, incluindo {plannedPayments.length} com status PREVISTO — apenas as {paidPayments.length} parcelas quitadas estão sendo emitidas.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md shrink-0">
            {paidPayments.length} de {selectedPayments.length} emitidas
          </span>
        </div>
      )}

      {/* Subheader com dados do arquivo gerado e total quitado - Tema Claro */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-500">Nome do arquivo final:</span>
          <span className="font-mono font-bold text-slate-800 bg-white border border-slate-300 px-2.5 py-0.5 rounded-md truncate max-w-xl select-all shadow-2xs">
            {suggestedFileName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-600">
            Total do Lote:{' '}
            <strong className="text-emerald-700 font-mono font-black text-sm ml-1">
              {formatarMoeda(totalPaidValue)}
            </strong>
          </span>
          <span className="text-slate-500 text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
            {paidPayments.length} {paidPayments.length === 1 ? 'via individual' : 'vias individuais'}
          </span>
        </div>
      </div>

      {/* Área Central: Layout Espaçoso Tela Cheia - Tema Claro */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-100">
        {/* Painel Lateral Esquerdo: Lista de Credores */}
        <aside className="w-full md:w-88 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden shadow-2xs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Recibos no Lote ({paidPayments.length})
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Clique para inspecionar
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {paidPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum pagamento quitado disponível no lote selecionado.
              </div>
            ) : (
              paidPayments.map((p, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                      isActive
                        ? 'bg-blue-50/90 border-l-4 border-blue-600 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate block text-slate-900">
                          {p.nome}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm shrink-0">
                          P{p.parcela}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span className="font-mono font-semibold text-emerald-700">
                          {formatarMoeda(p.valor)}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {formatarDataPtBr(p.dataPagamento || p.data)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Painel Central Direito: Visualizador da Folha A4 em Tela Cheia - Fundo Claro */}
        <main className="flex-1 bg-slate-200/50 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center">
          {paidPayments.length > 0 && currentPayment ? (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Barra de Navegação de Página - Tema Claro */}
              <div className="w-full max-w-[210mm] flex items-center justify-between bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl shadow-xs">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="text-xs font-bold text-slate-700 text-center">
                  Recibo <span className="text-blue-700 font-mono">{currentIndex + 1}</span> de{' '}
                  <span className="font-mono">{paidPayments.length}</span> •{' '}
                  <span className="text-slate-900 font-bold">{currentPayment.nome}</span>{' '}
                  <span className="text-blue-700 font-mono">(Parcela nº {currentPayment.parcela})</span>
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === paidPayments.length - 1}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Documento A4 Oficial Renderizado */}
              <div className="shadow-xl rounded-sm overflow-hidden border border-slate-300 bg-white">
                <ReceiptDocument
                  payment={currentPayment}
                  contract={contract}
                  onPrint={() => imprimirElementoRecibo('receipt-print-area')}
                />
              </div>
            </div>
          ) : (
            <div className="m-auto text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm max-w-md shadow-xs">
              <Info className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">Nenhum recibo quitado para exibir</p>
              <p className="text-xs text-slate-500 mt-1">
                Selecione parcelas com pagamento confirmado (status PAGO) para inspecionar e emitir os recibos correspondentes.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
