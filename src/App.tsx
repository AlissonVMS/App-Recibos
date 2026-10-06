import React, { useState, useEffect } from 'react';
import { Beneficiary, ContractConfig, PaymentRecord } from './types';
import {
  INITIAL_BENEFICIARIES,
  INITIAL_CONTRACT_CONFIG,
  INITIAL_PAYMENTS,
} from './data/initialData';
import { formatarMoeda } from './utils/numberToWordsPtBr';
import { ReceiptDocument } from './components/ReceiptDocument';
import { BatchPdfModal } from './components/BatchPdfModal';
import { PaymentModal } from './components/PaymentModal';
import { BeneficiaryModal } from './components/BeneficiaryModal';
import { ContractSettingsModal } from './components/ContractSettingsModal';
import { ContractManagementTab } from './components/ContractManagementTab';
import { DashboardCharts } from './components/DashboardCharts';
import { ReceiptsBatchPreviewModal } from './components/ReceiptsBatchPreviewModal';
import {
  baixarPdfRecibo,
  baixarPdfRecibosZip,
  emitirRecibos,
  gerarNomeArquivoLote,
  gerarNomeArquivoRecibo,
} from './utils/pdfGenerator';
import {
  FileText,
  DollarSign,
  Users,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Edit2,
  Trash2,
  Eye,
  Building2,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Calendar,
  Copy,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  AlertCircle,
  Archive,
  Printer,
} from 'lucide-react';

export function App() {
  // Persistence via localStorage (v5 for Parcela 13 and scheduled parcels 14-18)
  const [contract, setContract] = useState<ContractConfig>(() => {
    const saved = localStorage.getItem('app_recibos_contract_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tituloContrato) {
          parsed.tituloContrato = parsed.tituloContrato
            .replace(/,?\s*firmado\s+em.*$/i, '')
            .replace(/\.$/, '')
            .trim();
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_CONTRACT_CONFIG;
  });

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(() => {
    const saved = localStorage.getItem('app_recibos_beneficiaries_v5');
    return saved ? JSON.parse(saved) : INITIAL_BENEFICIARIES;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('app_recibos_payments_v5');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  useEffect(() => {
    localStorage.setItem('app_recibos_contract_v5', JSON.stringify(contract));
  }, [contract]);

  useEffect(() => {
    localStorage.setItem('app_recibos_beneficiaries_v5', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  useEffect(() => {
    localStorage.setItem('app_recibos_payments_v5', JSON.stringify(payments));
  }, [payments]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'geral' | 'tabela' | 'contrato' | 'exportar'>('geral');
  const [selectedReceiptPaymentId, setSelectedReceiptPaymentId] = useState<string>(
    INITIAL_PAYMENTS[0]?.id || ''
  );

  // Search & Filter state for table
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBeneficiary, setFilterBeneficiary] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'PAGO' | 'PREVISTO'>('todos');

  // Modals state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState<boolean>(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);

  // Recalculate totals (considerando apenas parcelas PAGAS para o total realizado)
  const totalContrato = beneficiaries.reduce((acc, b) => acc + b.contrato, 0);
  const totalPago = payments
    .filter((p) => (p.status || 'PAGO') === 'PAGO')
    .reduce((acc, p) => acc + p.valor, 0);
  const totalSaldo = Math.max(0, totalContrato - totalPago);
  const percentualRealizado = totalContrato > 0 ? (totalPago / totalContrato) * 100 : 0;

  // Filtered payments for table
  const filteredPayments = payments.filter((p) => {
    const paymentStatus = p.status || 'PAGO';
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm) ||
      p.parcela.toString().includes(searchTerm) ||
      p.banco.toLowerCase().includes(searchTerm) ||
      (p.dataPrevista && p.dataPrevista.includes(searchTerm)) ||
      (p.dataPagamento && p.dataPagamento.includes(searchTerm));

    const matchesBen = filterBeneficiary === 'todos' || p.nome === filterBeneficiary;
    const matchesStatus = filterStatus === 'todos' || paymentStatus === filterStatus;

    return matchesSearch && matchesBen && matchesStatus;
  });

  // Seleção múltipla para emissão de recibos na tabela de pagamentos
  const [selectedTablePaymentIds, setSelectedTablePaymentIds] = useState<Set<string>>(new Set());
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<PaymentRecord | null>(null);
  const [isBatchPreviewModalOpen, setIsBatchPreviewModalOpen] = useState<boolean>(false);

  // Filtra pagamentos filtrados que possuem status PAGO
  const filteredPaidPayments = filteredPayments.filter(
    (p) => (p.status || 'PAGO') === 'PAGO'
  );

  // Todos os pagamentos selecionados na tabela (PAGO e PREVISTO)
  const selectedTablePayments = payments.filter((p) => selectedTablePaymentIds.has(p.id));

  // Pagamentos selecionados que estão com status PAGO
  const selectedPaidTablePayments = selectedTablePayments.filter(
    (p) => (p.status || 'PAGO') === 'PAGO'
  );

  // Pagamentos selecionados que estão com status PREVISTO
  const selectedPrevistoTablePayments = selectedTablePayments.filter(
    (p) => p.status === 'PREVISTO'
  );

  // Conjunto de pagamentos enviados para conferência e emissão:
  // Se houver seleção manual (via caixas), usa os selecionados. Caso contrário, usa os filtrados da tabela.
  const paymentsForEmission =
    selectedTablePayments.length > 0 ? selectedTablePayments : filteredPayments;

  const paidPaymentsForEmission = paymentsForEmission.filter(
    (p) => (p.status || 'PAGO') === 'PAGO'
  );

  // Abre a tela de conferência de recibos antes de gerar os arquivos
  const handleOpenReceiptsPreview = () => {
    if (paidPaymentsForEmission.length === 0) {
      alert('Nenhuma parcela com status PAGO selecionada para emissão de recibo.');
      return;
    }
    setIsBatchPreviewModalOpen(true);
  };

  // Selected payment for individual receipt view
  const currentReceiptPayment =
    payments.find((p) => p.id === selectedReceiptPaymentId) || payments[0];

  // Marcar parcela programada como PAGA
  const handleMarkAsPaid = (paymentId: string) => {
    const today = new Date();
    const dia = String(today.getDate()).padStart(2, '0');
    const MESES = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const mes = MESES[today.getMonth()];
    const ano = String(today.getFullYear());
    const dataFormatada = `${ano}-${String(today.getMonth() + 1).padStart(2, '0')}-${dia}`;

    const updatedPayments = payments.map((p) => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'PAGO' as const,
          dataPagamento: dataFormatada,
          data: dataFormatada,
          dia,
          mes,
          ano,
        };
      }
      return p;
    });

    setPayments(updatedPayments);

    // Recalcula saldos dos cedentes
    setBeneficiaries((prev) =>
      prev.map((b) => {
        const benPaid = updatedPayments
          .filter((p) => p.nome === b.nome && (p.status || 'PAGO') === 'PAGO')
          .reduce((acc, p) => acc + p.valor, 0);
        const newSaldo = Math.max(0, b.contrato - benPaid);
        return {
          ...b,
          pago: benPaid,
          saldo: newSaldo,
          status: newSaldo === 0 ? 'QUITADO' : 'EM ABERTO',
        };
      })
    );
  };

  // Handler: Save payment
  const handleSavePayment = (payment: PaymentRecord) => {
    let updatedPayments: PaymentRecord[];
    const exists = payments.some((p) => p.id === payment.id);

    if (exists) {
      updatedPayments = payments.map((p) => (p.id === payment.id ? payment : p));
    } else {
      updatedPayments = [payment, ...payments];
    }
    setPayments(updatedPayments);

    // Update beneficiary totals (considera apenas pagamentos com status PAGO)
    const benPaidPayments = updatedPayments.filter(
      (p) => p.nome === payment.nome && (p.status || 'PAGO') === 'PAGO'
    );
    const sumPaid = benPaidPayments.reduce((acc, p) => acc + p.valor, 0);

    setBeneficiaries((prev) =>
      prev.map((b) => {
        if (b.nome === payment.nome) {
          const newSaldo = Math.max(0, b.contrato - sumPaid);
          return {
            ...b,
            pago: sumPaid,
            saldo: newSaldo,
            status: newSaldo === 0 ? 'QUITADO' : 'EM ABERTO',
          };
        }
        return b;
      })
    );

    setSelectedReceiptPaymentId(payment.id);
  };

  // Handler: Delete payment
  const handleDeletePayment = (id: string) => {
    if (!window.confirm('Deseja realmente excluir este registro de pagamento?')) return;
    const target = payments.find((p) => p.id === id);
    if (!target) return;

    const remaining = payments.filter((p) => p.id !== id);
    setPayments(remaining);

    // Update beneficiary totals (considera apenas pagamentos com status PAGO)
    const benPaidPayments = remaining.filter(
      (p) => p.nome === target.nome && (p.status || 'PAGO') === 'PAGO'
    );
    const sumPaid = benPaidPayments.reduce((acc, p) => acc + p.valor, 0);

    setBeneficiaries((prev) =>
      prev.map((b) => {
        if (b.nome === target.nome) {
          const newSaldo = Math.max(0, b.contrato - sumPaid);
          return {
            ...b,
            pago: sumPaid,
            saldo: newSaldo,
            status: newSaldo === 0 ? 'QUITADO' : 'EM ABERTO',
          };
        }
        return b;
      })
    );
  };

  // Handler: Save Beneficiary (mantém contrato e valores financeiros protegidos)
  const handleSaveBeneficiary = (updated: Beneficiary) => {
    setBeneficiaries((prev) =>
      prev.map((b) => {
        if (b.id === updated.id) {
          const benPayments = payments.filter((p) => p.nome === b.nome);
          const sumPaid = benPayments.reduce((acc, p) => acc + p.valor, 0);
          const newSaldo = Math.max(0, b.contrato - sumPaid);
          return {
            ...updated,
            contrato: b.contrato, // Protegido contra edição manual
            pago: sumPaid,
            saldo: newSaldo,
            status: newSaldo === 0 ? 'QUITADO' : 'EM ABERTO',
          };
        }
        return b;
      })
    );
  };

  // Reset to original Excel data
  const handleResetData = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar os dados originais da planilha "CONTROLE PAGAMENTOS.xlsx"?'
      )
    ) {
      setBeneficiaries(INITIAL_BENEFICIARIES);
      setPayments(INITIAL_PAYMENTS);
      setContract(INITIAL_CONTRACT_CONFIG);
      localStorage.clear();
      setSelectedReceiptPaymentId(INITIAL_PAYMENTS[0]?.id || '');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'NOME',
      'CPF',
      'PARCELA',
      'VALOR',
      'DATA',
      'FORMA PGTO',
      'CHAVE',
      'BANCO',
      'SALDO',
      'DIA',
      'MÊS',
      'ANO',
      'CIDADE / UF',
    ];
    const rows = payments.map((p) => [
      `"${p.nome}"`,
      `"${p.cpf}"`,
      p.parcela,
      p.valor,
      p.data,
      `"${p.formaPgto}"`,
      `"${p.chave}"`,
      `"${p.banco}"`,
      p.saldo,
      `"${p.dia}"`,
      `"${p.mes}"`,
      `"${p.ano}"`,
      `"${p.cidadeUf}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CONTROLE_PAGAMENTOS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg tracking-tight">App-Recibos</h1>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20">
                    Cessão Hereditária
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                  Pagador: {contract.pagadorNome} ({contract.pagadorCpf})
                </p>
              </div>
            </div>

            {/* Top Right Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setEditingPayment(null);
                  setIsPaymentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Pagamento</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-800/80 pt-1 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'geral'
                  ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Controle Geral
            </button>
            <button
              onClick={() => setActiveTab('tabela')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'tabela'
                  ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Registro de Pagamentos ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('contrato')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'contrato'
                  ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Gestão do Contrato
            </button>
            <button
              onClick={() => setActiveTab('exportar')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'exportar'
                  ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Download className="w-4 h-4" />
              Exportar & Backup
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: CONTROLE GERAL & BENEFICIÁRIOS */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            {/* Dashboard Executivo de Indicadores Visuais (Fiel ao Excel Controle Geral) */}
            <DashboardCharts
              beneficiaries={beneficiaries}
              contract={contract}
              payments={payments}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Beneficiários
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhamento individual de cotas, pagamentos, saldos e dados bancários para PIX
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Gerar PDFs em Lote
              </button>
            </div>

            {/* Beneficiaries Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {beneficiaries.map((b) => {
                const benPaidPayments = payments.filter(
                  (p) => p.nome === b.nome && (p.status || 'PAGO') === 'PAGO'
                );
                const benPlannedPayments = payments.filter(
                  (p) => p.nome === b.nome && p.status === 'PREVISTO'
                );
                const benTotalPago = benPaidPayments.reduce((acc, p) => acc + p.valor, 0);
                const benSaldoDevedor = Math.max(0, b.contrato - benTotalPago);
                const benPagoPerc = b.contrato > 0 ? (benTotalPago / b.contrato) * 100 : 0;
                const lastPayment =
                  benPaidPayments.length > 0 ? benPaidPayments[benPaidPayments.length - 1] : null;
                const nextPlanned =
                  benPlannedPayments.length > 0 ? benPlannedPayments[0] : null;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Status & Name */}
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            benSaldoDevedor === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {benSaldoDevedor === 0 ? 'QUITADO' : 'EM ABERTO'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingBeneficiary(b);
                            setIsBeneficiaryModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title="Editar dados"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {b.nome}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">CPF: {b.cpf}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.cidadeUf}</p>

                      {/* Financial details essenciais */}
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Valor Contratado:</span>
                          <span className="font-semibold text-slate-800">
                            {formatarMoeda(b.contrato)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Total Pago:</span>
                          <span className="font-bold text-emerald-600">
                            {formatarMoeda(benTotalPago)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Saldo Devedor:</span>
                          <span className="font-bold text-amber-600">
                            {formatarMoeda(benSaldoDevedor)}
                          </span>
                        </div>

                        {/* Barra visual simples e discreta (sem texto ou porcentagem redundante) */}
                        <div className="pt-1">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${benPagoPerc}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Box Última Parcela Paga deste Beneficiário */}
                      <div className="mt-3.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-purple-900 uppercase tracking-wider block">
                              Última Parcela Paga
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {lastPayment
                                ? `${lastPayment.dia} ${lastPayment.mes.slice(0, 3)} ${lastPayment.ano} (nº ${lastPayment.parcela})`
                                : 'Nenhum pagamento'}
                            </span>
                          </div>
                        </div>
                        {lastPayment && (
                          <div className="text-right">
                            <span className="text-xs font-black text-purple-800 block">
                              {formatarMoeda(lastPayment.valor)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Box Próxima Parcela Agendada (se houver) */}
                      {nextPlanned && (
                        <div className="mt-2 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-blue-700 font-medium">
                            Próxima Prevista: <strong>nº {nextPlanned.parcela}</strong> ({nextPlanned.dia}/{nextPlanned.mes.slice(0, 3)})
                          </span>
                          <span className="font-bold font-mono text-blue-900">
                            {formatarMoeda(nextPlanned.valor)}
                          </span>
                        </div>
                      )}

                      {/* Bank Details Box */}
                      <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{b.banco}</span>
                        </div>
                        <div className="text-slate-500 flex justify-between">
                          <span>
                            Ag: {b.agencia} • Conta: {b.conta}
                          </span>
                          <span className="text-[11px] uppercase font-mono">{b.tipoConta}</span>
                        </div>
                        {/* Divisão igualitária (50% / 50%) para Tipo de Chave e Chave PIX */}
                        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Tipo de Chave
                            </span>
                            <div className="bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 truncate">
                                {b.tipoChavePix || 'CPF'}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Chave PIX
                            </span>
                            <div
                              className="bg-white border border-slate-200/90 rounded-lg px-2 py-1.5 flex items-center justify-between group cursor-pointer hover:border-blue-400 transition-colors"
                              title={`Chave PIX: ${b.chavePix} (Clique para copiar)`}
                              onClick={() => {
                                navigator.clipboard.writeText(b.chavePix);
                              }}
                            >
                              <span className="font-mono text-[11px] font-bold text-slate-800 truncate block">
                                {b.chavePix}
                              </span>
                              <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {benPaidPayments.length} parcelas pagas
                      </span>
                      <button
                        onClick={() => {
                          setFilterBeneficiary(b.nome);
                          setActiveTab('tabela');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Ver pagamentos
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRO DE PAGAMENTOS (TABELA) */}
        {activeTab === 'tabela' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Registro Histórico de Pagamentos
                </h2>
                <p className="text-xs text-slate-500">
                  Controle das parcelas pagas, saldos remanescentes e geração instantânea de recibo
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Exportar CSV
                </button>
                <button
                  onClick={handleOpenReceiptsPreview}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                  title="Conferir e emitir recibos das parcelas pagas"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {paidPaymentsForEmission.length > 1
                    ? `Emitir Recibos (${paidPaymentsForEmission.length})`
                    : paidPaymentsForEmission.length === 1
                    ? 'Emitir Recibo (1)'
                    : 'Emitir Recibo'}
                </button>
                <button
                  onClick={() => {
                    setEditingPayment(null);
                    setIsPaymentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Pagamento
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por beneficiário, CPF, parcela, banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterBeneficiary}
                    onChange={(e) => setFilterBeneficiary(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 bg-slate-50 py-2 px-2.5 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="todos">Todos os Beneficiários</option>
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.nome}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="text-xs rounded-lg border border-slate-200 bg-slate-50 py-2 px-2.5 focus:bg-white focus:border-blue-500 focus:outline-hidden font-semibold"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="PAGO">Somente Pagos ({payments.filter(p => (p.status || 'PAGO') === 'PAGO').length})</option>
                  <option value="PREVISTO">Somente Previstos ({payments.filter(p => p.status === 'PREVISTO').length})</option>
                </select>
              </div>
            </div>

            {/* Barra Conveniente de Seleção para Emissão de Recibos */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700">
                  {selectedTablePayments.length > 0 ? (
                    <>
                      <strong className="text-blue-700 font-bold">{selectedTablePayments.length}</strong>{' '}
                      parcela{selectedTablePayments.length > 1 ? 's' : ''} selecionada{selectedTablePayments.length > 1 ? 's' : ''} •{' '}
                      <span className="text-emerald-700 font-bold">
                        {selectedPaidTablePayments.length} paga{selectedPaidTablePayments.length > 1 ? 's' : ''} ({formatarMoeda(selectedPaidTablePayments.reduce((acc, p) => acc + p.valor, 0))})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500">
                      Nenhuma parcela marcada manualmente. Clique nas caixas de seleção da tabela para marcar em lote.
                    </span>
                  )}
                </span>

                {/* Aviso compacto quando itens PREVISTOS estão na seleção */}
                {selectedPrevistoTablePayments.length > 0 && (
                  <span className="bg-amber-50 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Atenção:</strong> Foram marcados {selectedTablePayments.length} itens no total, incluindo {selectedPrevistoTablePayments.length} com status PREVISTO, apenas as {selectedPaidTablePayments.length} parcelas pagas estão sendo emitidas.
                    </span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = filteredPayments.map((p) => p.id);
                    setSelectedTablePaymentIds(new Set(allIds));
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
                  title="Selecionar todos os itens exibidos (pagos e previstos)"
                >
                  Marcar Todos ({filteredPayments.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allPaidIds = payments
                      .filter((p) => (p.status || 'PAGO') === 'PAGO')
                      .map((p) => p.id);
                    setSelectedTablePaymentIds(new Set(allPaidIds));
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                >
                  Marcar Somente Pagos ({payments.filter((p) => (p.status || 'PAGO') === 'PAGO').length})
                </button>
                {selectedTablePaymentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTablePaymentIds(new Set())}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                  >
                    Desmarcar Todos
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredPayments.length > 0 &&
                            filteredPayments.every((p) =>
                              selectedTablePaymentIds.has(p.id)
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTablePaymentIds((prev) => {
                                const next = new Set(prev);
                                filteredPayments.forEach((p) => next.add(p.id));
                                return next;
                              });
                            } else {
                              setSelectedTablePaymentIds((prev) => {
                                const next = new Set(prev);
                                filteredPayments.forEach((p) => next.delete(p.id));
                                return next;
                              });
                            }
                          }}
                          className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          title="Marcar/Desmarcar todas as parcelas visíveis (pagas e previstas)"
                        />
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold">Beneficiário</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Parcela</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Previsão</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Data Pgto</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Valor</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Saldo Restante</th>
                      <th className="py-2.5 px-3 font-semibold">Forma / Pix</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Ações & Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          Nenhum registro de pagamento encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => {
                        const isPrevisto = p.status === 'PREVISTO';
                        const isSelected = selectedTablePaymentIds.has(p.id);

                        // Data prevista formatada
                        const previsaoFormatada = p.dataPrevista
                          ? `${p.dataPrevista.split('-')[2]}/${p.dataPrevista.split('-')[1]}/${p.dataPrevista.split('-')[0]}`
                          : `${p.dia.padStart(2, '0')}/${p.mes.slice(0, 3)}/${p.ano}`;

                        // Data pagamento formatada
                        const pgtoFormatada = p.dataPagamento
                          ? `${p.dataPagamento.split('-')[2]}/${p.dataPagamento.split('-')[1]}/${p.dataPagamento.split('-')[0]}`
                          : p.data && !isPrevisto
                          ? `${p.data.split('-')[2]}/${p.data.split('-')[1]}/${p.data.split('-')[0]}`
                          : null;

                        return (
                          <tr
                            key={p.id}
                            onClick={() => {
                              setSelectedTablePaymentIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(p.id)) next.delete(p.id);
                                else next.add(p.id);
                                return next;
                              });
                            }}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/70 hover:bg-blue-50'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td
                              className="py-2.5 px-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedTablePaymentIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(p.id)) next.delete(p.id);
                                    else next.add(p.id);
                                    return next;
                                  });
                                }}
                                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                title={
                                  isPrevisto
                                    ? 'Parcela com status PREVISTO (não gera recibo civil)'
                                    : isSelected
                                    ? 'Desmarcar parcela'
                                    : 'Selecionar parcela'
                                }
                              />
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span className="font-semibold text-slate-900 block text-xs">{p.nome}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.cpf}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] font-mono">
                                nº {p.parcela}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              {isPrevisto ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full font-bold text-[10px] tracking-tight">
                                  <Clock className="w-2.5 h-2.5" />
                                  PREVISTO
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-bold text-[10px] tracking-tight">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  PAGO
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="font-mono text-slate-700 text-xs">
                                {previsaoFormatada}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {isPrevisto ? (
                                <span className="text-slate-400 font-mono text-xs italic">-</span>
                              ) : (
                                <span className="font-mono font-semibold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                                  {pgtoFormatada || `${p.dia}/${p.mes.slice(0, 3)}`}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-900 text-xs bg-slate-50 border border-slate-200/90 px-2 py-0.5 rounded-md inline-block">
                                {formatarMoeda(p.valor)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <span className="font-mono font-bold text-amber-700 text-xs bg-amber-50/60 border border-amber-200/60 px-2 py-0.5 rounded-md inline-block">
                                {formatarMoeda(p.saldo)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-800 block text-xs">{p.formaPgto}</span>
                              <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[130px]" title={p.chave}>
                                {p.chave}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Se for previsto: botão para registrar pagamento */}
                                {isPrevisto && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsPaid(p.id);
                                    }}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                    title="Confirmar Pagamento Efetivado"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Visualizar Recibo diretamente nesta tela */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingReceiptPayment(p);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100/70 rounded-md transition-colors"
                                  title="Visualizar Recibo Oficial (1ª VIA)"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Emitir Recibo (Download Individual do PDF) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    baixarPdfRecibo(p, contract);
                                  }}
                                  disabled={isPrevisto}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                                  title={
                                    isPrevisto
                                      ? 'Recibo disponível apenas após pagamento confirmado (status PAGO)'
                                      : `Emitir PDF: ${gerarNomeArquivoRecibo(p)}`
                                  }
                                >
                                  <Download className="w-4 h-4" />
                                </button>

                                {/* Editar */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPayment(p);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                                  title="Editar Parcela"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Excluir */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePayment(p.id);
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-600 rounded-md transition-colors"
                                  title="Excluir Parcela"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer with count */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Exibindo <strong className="text-slate-800">{filteredPayments.length}</strong> de {payments.length} registros
                </span>
                <span className="font-mono text-slate-700">
                  Total Pago Exibido: <strong className="text-slate-900 font-bold ml-1 font-mono">{formatarMoeda(filteredPayments.reduce((s, p) => s + p.valor, 0))}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GESTÃO DO CONTRATO & PARTES */}
        {activeTab === 'exportar' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Exportação de Dados & Backup</h2>
              <p className="text-xs text-slate-500">
                Exporte os dados para Excel, faça backup ou restaure para os dados originais importados
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CSV Export */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Exportar para Excel / CSV</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Baixe todos os registros de pagamentos formatados em planilha CSV (compatível com Microsoft Excel).
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Baixar Planilha CSV
                </button>
              </div>

              {/* Batch PDF panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Gerador de PDFs em Lote</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Gere e baixe múltiplos recibos PDF de uma vez só com nomenclatura padronizada e anti-sobrescrita.
                  </p>
                </div>
                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Abrir Painel PDF
                </button>
              </div>
            </div>

            {/* Reset original data */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Restaurar Dados Originais</h4>
                <p className="text-xs text-amber-800 mt-1">
                  Restaura todas as parcelas e beneficiários para os dados originais contidos no arquivo{' '}
                  <span className="font-mono font-semibold">CONTROLE PAGAMENTOS.xlsx</span>.
                </p>
              </div>
              <button
                onClick={handleResetData}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Planilha
              </button>
            </div>
          </div>
        )}

        {/* TAB: GESTÃO DO CONTRATO & PARTES (NOVA ABA ESPECÍFICA) */}
        {activeTab === 'contrato' && (
          <ContractManagementTab
            contract={contract}
            beneficiaries={beneficiaries}
            onSave={(updatedContract, updatedBeneficiaries) => {
              setContract(updatedContract);
              setBeneficiaries(
                updatedBeneficiaries.map((b) => {
                  const benPayments = payments.filter((p) => p.nome === b.nome);
                  const sumPaid = benPayments.reduce((acc, p) => acc + p.valor, 0);
                  const calculatedSaldo = Math.max(0, (Number(b.contrato) || 0) - sumPaid);
                  return {
                    ...b,
                    contrato: Number(b.contrato) || 0,
                    pago: sumPaid,
                    saldo: calculatedSaldo,
                    status: calculatedSaldo === 0 ? 'QUITADO' : 'EM ABERTO',
                  };
                })
              );
            }}
          />
        )}
      </main>

      {/* Modals */}
      <BatchPdfModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        payments={payments}
        beneficiaries={beneficiaries}
        contract={contract}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingPayment(null);
        }}
        onSave={handleSavePayment}
        beneficiaries={beneficiaries}
        existingPayment={editingPayment}
        existingPayments={payments}
      />

      <BeneficiaryModal
        isOpen={isBeneficiaryModalOpen}
        onClose={() => {
          setIsBeneficiaryModalOpen(false);
          setEditingBeneficiary(null);
        }}
        beneficiary={editingBeneficiary}
        onSave={handleSaveBeneficiary}
      />

      <ContractSettingsModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contract={contract}
        beneficiaries={beneficiaries}
        onSave={(updatedContract, updatedBeneficiaries) => {
          setContract(updatedContract);
          setBeneficiaries(
            updatedBeneficiaries.map((b) => {
              const benPayments = payments.filter((p) => p.nome === b.nome);
              const sumPaid = benPayments.reduce((acc, p) => acc + p.valor, 0);
              const calculatedSaldo = Math.max(0, (Number(b.contrato) || 0) - sumPaid);
              return {
                ...b,
                contrato: Number(b.contrato) || 0,
                pago: sumPaid,
                saldo: calculatedSaldo,
                status: calculatedSaldo === 0 ? 'QUITADO' : 'EM ABERTO',
              };
            })
          );
        }}
      />

      {/* Visualização de Recibo em Tela Cheia (Mesmo espaço da janela principal - Tema Claro) */}
      {viewingReceiptPayment && (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150">
          <header className="bg-white border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewingReceiptPayment(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold"
                title="Voltar ao Registro de Pagamentos"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="hidden sm:inline">Voltar</span>
              </button>

              <div className="h-5 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    {viewingReceiptPayment.nome}
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Parcela nº {viewingReceiptPayment.parcela}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {viewingReceiptPayment.status || 'PAGO'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono hidden sm:block">
                    Valor: {formatarMoeda(viewingReceiptPayment.valor)} • CPF: {viewingReceiptPayment.cpf}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                title="Imprimir via do recibo"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Imprimir</span>
              </button>

              <button
                onClick={() => baixarPdfRecibo(viewingReceiptPayment, contract)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all"
                title={`Baixar PDF: ${gerarNomeArquivoRecibo(viewingReceiptPayment)}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>

              <button
                onClick={() => setViewingReceiptPayment(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors ml-1"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 bg-slate-200/50 p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center">
            <div className="shadow-xl rounded-sm overflow-hidden my-auto border border-slate-300 bg-white">
              <ReceiptDocument
                payment={viewingReceiptPayment}
                contract={contract}
                onPrint={() => window.print()}
              />
            </div>
          </main>
        </div>
      )}

      {/* Modal de Conferência de Recibos antes da Emissão */}
      <ReceiptsBatchPreviewModal
        isOpen={isBatchPreviewModalOpen}
        onClose={() => setIsBatchPreviewModalOpen(false)}
        selectedPayments={paymentsForEmission}
        contract={contract}
      />
    </div>
  );
}

export default App;
