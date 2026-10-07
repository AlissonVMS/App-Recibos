import React, { useState, useEffect } from 'react';
import { Beneficiary, ContractConfig, PaymentRecord } from './types';
import {
  INITIAL_BENEFICIARIES,
  INITIAL_CONTRACT_CONFIG,
  INITIAL_PAYMENTS,
} from './data/initialData';
import { formatarMoeda } from './utils/numberToWordsPtBr';
import { ReceiptDocument } from './components/ReceiptDocument';
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
import { imprimirElementoRecibo } from './utils/printHelper';
import { apiService } from './services/apiService';
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
  Info,
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

  // Backend C# .NET 9 Status & Sync State
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    async function initBackend() {
      const isOnline = await apiService.checkHealth();
      setIsBackendConnected(isOnline);
      if (isOnline) {
        try {
          const [c, b, p] = await Promise.all([
            apiService.getContrato(),
            apiService.getBeneficiarios(),
            apiService.getPagamentos(),
          ]);
          if (c) setContract(c);
          if (b && b.length > 0) setBeneficiaries(b);
          if (p && p.length > 0) setPayments(p);
        } catch (err) {
          console.warn('Erro ao carregar dados do backend C#:', err);
        }
      }
    }
    initBackend();
  }, []);

  const handleSyncExcel = async () => {
    if (!isBackendConnected) {
      alert('Backend C# .NET 9 não detectado. Inicie o backend com ./run-dev.sh ou dotnet run em core/src/AppRecibos.Api.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await apiService.syncExcel();
      if (res.success) {
        const [b, p] = await Promise.all([
          apiService.getBeneficiarios(),
          apiService.getPagamentos(),
        ]);
        if (b && b.length > 0) setBeneficiaries(b);
        if (p && p.length > 0) setPayments(p);
        alert(res.message || 'Sincronização com Excel concluída com sucesso!');
      } else {
        alert('Erro ao sincronizar com Excel: ' + res.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

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

  // Estado para diálogo de confirmação com padrão sênior de UX/UI e Financeiro
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    details?: { label: string; value: string }[];
    confirmLabel: string;
    confirmVariant: 'emerald' | 'amber' | 'red';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    confirmVariant: 'emerald',
    onConfirm: () => {},
  });

  // Tecla ESC para fechar modal de confirmação ou visualização do recibo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog.isOpen) {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          return;
        }
        if (viewingReceiptPayment) {
          setViewingReceiptPayment(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog.isOpen, viewingReceiptPayment]);

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

  // Executa: Marcar parcela como PAGA
  const executeMarkAsPaid = (paymentId: string) => {
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

    if (isBackendConnected) {
      apiService.quitarPagamento(paymentId, dataFormatada);
    }

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

  // Solicita confirmação antes de marcar como pago (Sênior UX & Financeiro)
  const handleMarkAsPaid = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    if (!p) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Pagamento',
      message: `Deseja registrar o pagamento da parcela nº ${p.parcela} de ${p.nome} no valor de ${formatarMoeda(p.valor)} como PAGA?`,
      details: [
        { label: 'Beneficiário (Cedente)', value: p.nome },
        { label: 'Identificação', value: `Parcela nº ${p.parcela}` },
        { label: 'Valor da Parcela', value: formatarMoeda(p.valor) },
        { label: 'Novo Status', value: 'PAGO' },
      ],
      subMessage:
        'A parcela será registrada como liquidada na data de hoje, amortizando o saldo devedor no controle financeiro e liberando a emissão do recibo oficial.',
      confirmLabel: 'Confirmar Pagamento',
      confirmVariant: 'emerald',
      onConfirm: () => {
        executeMarkAsPaid(paymentId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Executa: Reverter parcela para PREVISTO
  const executeRevertToPrevisto = (paymentId: string) => {
    const updatedPayments = payments.map((p) => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'PREVISTO' as const,
          dataPagamento: undefined,
        };
      }
      return p;
    });

    setPayments(updatedPayments);

    if (isBackendConnected) {
      apiService.reverterPagamento(paymentId);
    }

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

  // Solicita confirmação antes de reverter para previsto (Sênior UX & Financeiro)
  const handleRevertToPrevisto = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    if (!p) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Desfazer Quitação',
      message: `Deseja desfazer a quitação e reverter a parcela nº ${p.parcela} de ${p.nome} para PREVISTO? O saldo devedor será recalculado.`,
      details: [
        { label: 'Beneficiário (Cedente)', value: p.nome },
        { label: 'Identificação', value: `Parcela nº ${p.parcela}` },
        { label: 'Valor da Parcela', value: formatarMoeda(p.valor) },
        { label: 'Novo Status', value: 'PREVISTO' },
      ],
      subMessage:
        'Atenção: A data de quitação será removida, o status retornará para PREVISTO e o saldo devedor do cedente será automaticamente restabelecido.',
      confirmLabel: 'Desfazer Quitação',
      confirmVariant: 'amber',
      onConfirm: () => {
        executeRevertToPrevisto(paymentId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Executa: Marcar selecionadas como pagas em lote
  const executeBatchMarkAsPaid = () => {
    if (selectedTablePaymentIds.size === 0) return;
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
      if (selectedTablePaymentIds.has(p.id)) {
        return {
          ...p,
          status: 'PAGO' as const,
          dataPagamento: p.dataPagamento || dataFormatada,
          data: p.data || dataFormatada,
          dia: p.dia || dia,
          mes: p.mes || mes,
          ano: p.ano || ano,
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

  // Solicita confirmação antes de marcar em lote (Sênior UX & Financeiro)
  const handleBatchMarkAsPaid = () => {
    if (selectedPrevistoTablePayments.length === 0) return;
    const totalValor = selectedPrevistoTablePayments.reduce((acc, p) => acc + p.valor, 0);
    setConfirmDialog({
      isOpen: true,
      title: 'Liquidação de Parcelas em Lote',
      message: `Confirma a liquidação em lote de ${selectedPrevistoTablePayments.length} parcelas previstas selecionadas?`,
      details: [
        { label: 'Quantidade de Parcelas', value: `${selectedPrevistoTablePayments.length} parcela(s)` },
        { label: 'Montante Total a Liquidar', value: formatarMoeda(totalValor) },
      ],
      subMessage:
        'Todas as parcelas selecionadas serão registradas como quitadas na data de hoje, amortizando os saldos devedores dos respectivos cedentes.',
      confirmLabel: `Liquidar ${selectedPrevistoTablePayments.length} Parcelas`,
      confirmVariant: 'emerald',
      onConfirm: () => {
        executeBatchMarkAsPaid();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Executa: Reverter selecionadas para previsto em lote
  const executeBatchRevertToPrevisto = () => {
    if (selectedTablePaymentIds.size === 0) return;

    const updatedPayments = payments.map((p) => {
      if (selectedTablePaymentIds.has(p.id)) {
        return {
          ...p,
          status: 'PREVISTO' as const,
          dataPagamento: undefined,
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

  // Solicita confirmação antes de reverter em lote (Sênior UX & Financeiro)
  const handleBatchRevertToPrevisto = () => {
    if (selectedPaidTablePayments.length === 0) return;
    const totalValor = selectedPaidTablePayments.reduce((acc, p) => acc + p.valor, 0);
    setConfirmDialog({
      isOpen: true,
      title: 'Reversão de Lote para Previsto',
      message: `Deseja estornar a liquidação de ${selectedPaidTablePayments.length} parcelas pagas selecionadas?`,
      details: [
        { label: 'Quantidade de Parcelas', value: `${selectedPaidTablePayments.length} parcela(s)` },
        { label: 'Montante Total a Reverter', value: formatarMoeda(totalValor) },
      ],
      subMessage:
        'O status de todas as parcelas marcadas retornará para PREVISTO, e os saldos devedores serão recalculados e restabelecidos no controle contratual.',
      confirmLabel: `Reverter ${selectedPaidTablePayments.length} Parcelas`,
      confirmVariant: 'amber',
      onConfirm: () => {
        executeBatchRevertToPrevisto();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
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

  // Executa: Exclusão definitiva de parcela
  const executeDeletePayment = (id: string) => {
    const target = payments.find((p) => p.id === id);
    if (!target) return;

    const remaining = payments.filter((p) => p.id !== id);
    setPayments(remaining);

    if (isBackendConnected) {
      apiService.excluirPagamento(id);
    }

    // Remove da seleção se estiver marcado
    setSelectedTablePaymentIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      return prev;
    });

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

  // Solicita confirmação antes de excluir parcela com padrão Sênior UX e Financeiro
  const handleDeletePayment = (id: string) => {
    const target = payments.find((p) => p.id === id);
    if (!target) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Parcela',
      message: `Deseja realmente excluir o lançamento da parcela nº ${target.parcela} de ${target.nome} no valor de ${formatarMoeda(target.valor)}?`,
      details: [
        { label: 'Beneficiário (Cedente)', value: target.nome },
        { label: 'Identificação', value: `Parcela nº ${target.parcela}` },
        { label: 'Valor da Parcela', value: formatarMoeda(target.valor) },
        { label: 'Status Atual', value: target.status || 'PAGO' },
      ],
      subMessage:
        'Atenção: Esta ação é definitiva e removerá permanentemente o registro financeiro. O saldo devedor do cedente será recalculado no controle contratual.',
      confirmLabel: 'Sim, Excluir Parcela',
      confirmVariant: 'red',
      onConfirm: () => {
        executeDeletePayment(id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handler: Save Beneficiary (mantém contrato e valores financeiros protegidos)
  const handleSaveBeneficiary = (updated: Beneficiary) => {
    if (isBackendConnected) {
      apiService.updateBeneficiario(updated.id, updated);
    }
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
              {isBackendConnected && (
                <button
                  onClick={handleSyncExcel}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                  title="Sincronizar dados com a planilha CONTROLE PAGAMENTOS.xlsx"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Excel'}</span>
                </button>
              )}

              <div className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-slate-900/60 border-slate-700/60">
                <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-slate-300 font-medium">
                  {isBackendConnected ? 'Backend .NET 9 Ativo' : 'Modo Offline Local'}
                </span>
              </div>

              <button
                onClick={() => {
                  setEditingPayment(null);
                  setIsPaymentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
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

            <div className="pt-2 border-t border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Beneficiários
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento individual de cotas, pagamentos, saldos e dados bancários para PIX
              </p>
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 flex flex-col gap-2.5 text-xs">
              {/* Linha 1: Contagem e Botões em Linha Confortável */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                {/* Resumo com badges e whitespace-nowrap para nunca quebrar de forma desconfortável */}
                <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                  <span className="font-semibold text-slate-700 inline-flex items-center gap-1.5 flex-wrap">
                    {selectedTablePayments.length > 0 ? (
                      <>
                        <span className="bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded-md font-mono text-xs shadow-2xs">
                          {selectedTablePayments.length} selecionada{selectedTablePayments.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-400 font-bold">•</span>
                        <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-md font-mono text-xs shadow-2xs">
                          {selectedPaidTablePayments.length} paga{selectedPaidTablePayments.length > 1 ? 's' : ''} ({formatarMoeda(selectedPaidTablePayments.reduce((acc, p) => acc + p.valor, 0))})
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 font-normal">
                        Nenhuma parcela marcada manualmente. Clique nas caixas de seleção da tabela para marcar em lote.
                      </span>
                    )}
                  </span>
                </div>

                {/* Botões de Ação Redimensionados para Visualização Confortável em Linha */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {/* Ações em lote para parcelas selecionadas */}
                  {selectedTablePayments.length > 0 && (
                    <>
                      {selectedPrevistoTablePayments.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBatchMarkAsPaid}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors whitespace-nowrap"
                          title="Marcar todas as parcelas previstas selecionadas como PAGAS"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pagar ({selectedPrevistoTablePayments.length})</span>
                        </button>
                      )}

                      {selectedPaidTablePayments.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBatchRevertToPrevisto}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md shadow-2xs transition-colors whitespace-nowrap"
                          title="Desmarcar pagamentos e reverter parcelas selecionadas para PREVISTO"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reverter ({selectedPaidTablePayments.length})</span>
                        </button>
                      )}

                      {selectedPaidTablePayments.length > 0 && (
                        <button
                          type="button"
                          onClick={handleOpenReceiptsPreview}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors whitespace-nowrap"
                          title="Conferir previamente e emitir recibos das parcelas pagas selecionadas"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Emitir ({selectedPaidTablePayments.length})</span>
                        </button>
                      )}

                      <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const allIds = filteredPayments.map((p) => p.id);
                      setSelectedTablePaymentIds(new Set(allIds));
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors whitespace-nowrap"
                    title="Selecionar todos os itens exibidos (pagos e previstos)"
                  >
                    Todos ({filteredPayments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allPaidIds = payments
                        .filter((p) => (p.status || 'PAGO') === 'PAGO')
                        .map((p) => p.id);
                      setSelectedTablePaymentIds(new Set(allPaidIds));
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors whitespace-nowrap"
                    title="Selecionar apenas as parcelas com status PAGO"
                  >
                    Somente Pagos ({payments.filter((p) => (p.status || 'PAGO') === 'PAGO').length})
                  </button>
                  {selectedTablePaymentIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTablePaymentIds(new Set())}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors whitespace-nowrap"
                      title="Desmarcar todas as parcelas selecionadas"
                    >
                      Desmarcar
                    </button>
                  )}
                </div>
              </div>

              {/* Linha 2 (Abaixo dos botões, nunca os desloca): Aviso Informativo */}
              {selectedPrevistoTablePayments.length > 0 && (
                <div className="w-full bg-blue-50/80 text-blue-900 border border-blue-200/90 px-3 py-2 rounded-lg font-medium text-[11px] flex items-center gap-2 shadow-2xs border-t border-slate-200/50 mt-0.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    <strong>Aviso Informativo:</strong> Foram marcados {selectedTablePayments.length} itens no total, incluindo {selectedPrevistoTablePayments.length} com status PREVISTO — apenas as {selectedPaidTablePayments.length} parcelas quitadas estão sendo emitidas.
                  </span>
                </div>
              )}
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
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(p.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-emerald-50 text-amber-700 hover:text-emerald-700 border border-amber-200/80 hover:border-emerald-300 rounded-full font-bold text-[10px] tracking-tight transition-all cursor-pointer group shadow-2xs"
                                  title="Clique para marcar como PAGO"
                                >
                                  <Clock className="w-2.5 h-2.5 group-hover:hidden" />
                                  <CheckCircle2 className="w-2.5 h-2.5 hidden group-hover:inline text-emerald-600" />
                                  <span>PREVISTO</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevertToPrevisto(p.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-amber-50 text-emerald-700 hover:text-amber-800 border border-emerald-200/80 hover:border-amber-300 rounded-full font-bold text-[10px] tracking-tight transition-all cursor-pointer group shadow-2xs"
                                  title="Clique para desmarcar e voltar para PREVISTO"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 group-hover:hidden" />
                                  <RotateCcw className="w-2.5 h-2.5 hidden group-hover:inline text-amber-700" />
                                  <span>PAGO</span>
                                </button>
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
                                {/* Alternador de Status individual */}
                                {isPrevisto ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsPaid(p.id);
                                    }}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                    title="Confirmar Pagamento (Marcar como PAGO)"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRevertToPrevisto(p.id);
                                    }}
                                    className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                                    title="Desmarcar Pagamento (Reverter para PREVISTO)"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Opção UNIFICADA de Recibo: Exibir Recibo (Conferência obrigatória antes da emissão/download) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingReceiptPayment(p);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 rounded-lg transition-colors shadow-2xs"
                                  title="Exibir Recibo Oficial (Conferência prévia obrigatória antes de baixar ou imprimir)"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Exibir Recibo</span>
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

                                {/* Excluir Parcela */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePayment(p.id);
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
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

            <div>
              {/* CSV Export */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Exportar para Excel / CSV</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Baixe todos os registros de pagamentos formatados em planilha CSV (compatível com Microsoft Excel).
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="shrink-0 py-2 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Baixar Planilha CSV
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
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingPayment(null);
        }}
        onSave={handleSavePayment}
        onDelete={handleDeletePayment}
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
                type="button"
                onClick={() => setViewingReceiptPayment(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold cursor-pointer"
                title="Voltar ao Registro de Pagamentos (ou pressione ESC)"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Voltar</span>
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
                type="button"
                onClick={() => {
                  if (viewingReceiptPayment.status === 'PREVISTO') {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Parcela com Status PREVISTO',
                      message: `A parcela nº ${viewingReceiptPayment.parcela} de ${viewingReceiptPayment.nome} está registrada como PREVISTO. Deseja registrar a quitação desta parcela agora para liberar a impressão do recibo oficial?`,
                      details: [
                        { label: 'Beneficiário (Cedente)', value: viewingReceiptPayment.nome },
                        { label: 'Identificação', value: `Parcela nº ${viewingReceiptPayment.parcela}` },
                        { label: 'Valor da Parcela', value: formatarMoeda(viewingReceiptPayment.valor) },
                      ],
                      subMessage:
                        'Recibos oficiais de quitação plena exigem que a parcela esteja com status PAGO. Ao confirmar, o pagamento será liquidado e a impressão será aberta.',
                      confirmLabel: 'Quitar e Imprimir Recibo',
                      confirmVariant: 'emerald',
                      onConfirm: () => {
                        executeMarkAsPaid(viewingReceiptPayment.id);
                        setViewingReceiptPayment((prev) =>
                          prev ? { ...prev, status: 'PAGO' } : null
                        );
                        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                        setTimeout(() => {
                          imprimirElementoRecibo('receipt-print-area');
                        }, 300);
                      },
                    });
                    return;
                  }
                  imprimirElementoRecibo('receipt-print-area');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title={
                  viewingReceiptPayment.status === 'PREVISTO'
                    ? 'Parcela prevista: clique para quitar e imprimir via oficial'
                    : 'Imprimir via oficial do recibo'
                }
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (viewingReceiptPayment.status === 'PREVISTO') {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Parcela com Status PREVISTO',
                      message: `A parcela nº ${viewingReceiptPayment.parcela} de ${viewingReceiptPayment.nome} está registrada como PREVISTO. Deseja registrar a quitação desta parcela agora para gerar o PDF oficial?`,
                      details: [
                        { label: 'Beneficiário (Cedente)', value: viewingReceiptPayment.nome },
                        { label: 'Identificação', value: `Parcela nº ${viewingReceiptPayment.parcela}` },
                        { label: 'Valor da Parcela', value: formatarMoeda(viewingReceiptPayment.valor) },
                      ],
                      subMessage:
                        'Recibos oficiais de quitação plena exigem que a parcela esteja com status PAGO. Ao confirmar, o pagamento será liquidado e o download iniciado.',
                      confirmLabel: 'Quitar e Baixar PDF',
                      confirmVariant: 'emerald',
                      onConfirm: () => {
                        executeMarkAsPaid(viewingReceiptPayment.id);
                        const updated = { ...viewingReceiptPayment, status: 'PAGO' as const };
                        setViewingReceiptPayment(updated);
                        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                        setTimeout(() => {
                          baixarPdfRecibo(updated, contract);
                        }, 300);
                      },
                    });
                    return;
                  }
                  baixarPdfRecibo(viewingReceiptPayment, contract);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer"
                title={
                  viewingReceiptPayment.status === 'PREVISTO'
                    ? 'Parcela prevista: clique para quitar e baixar PDF'
                    : `Baixar PDF: ${gerarNomeArquivoRecibo(viewingReceiptPayment)}`
                }
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </header>

          {/* AVISO INFORMATIVO LOGO ABAIXO DA BARRA (Não colado na folha A4) */}
          {viewingReceiptPayment.status === 'PREVISTO' && (
            <div className="bg-blue-50/95 border-b border-blue-200 px-4 sm:px-6 py-2.5 text-blue-900 text-xs flex items-center justify-between gap-3 shrink-0 shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Aviso Informativo:</strong> Esta parcela está registrada como <strong>PREVISTO</strong> no cronograma. A emissão do recibo de quitação definitiva estará disponível após a confirmação do pagamento (status PAGO).
                </span>
              </div>
            </div>
          )}

          <main className="flex-1 bg-slate-200/50 p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center">
            <div className="shadow-xl rounded-sm overflow-hidden my-auto border border-slate-300 bg-white">
              <ReceiptDocument
                payment={viewingReceiptPayment}
                contract={contract}
                onPrint={
                  viewingReceiptPayment.status === 'PREVISTO'
                    ? undefined
                    : () => imprimirElementoRecibo('receipt-print-area')
                }
              />
            </div>
          </main>
        </div>
      )}

      {/* Modal de Confirmação para Marcar como Pago, Reverter ou Excluir */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.confirmVariant === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : confirmDialog.confirmVariant === 'red'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {confirmDialog.confirmVariant === 'emerald' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : confirmDialog.confirmVariant === 'red' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs font-semibold text-slate-800 mt-1 leading-relaxed">
                  {confirmDialog.message}
                </p>

                {confirmDialog.details && confirmDialog.details.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-1.5">
                    {confirmDialog.details.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">{d.label}:</span>
                        <span className="font-bold text-slate-900 font-mono">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {confirmDialog.subMessage && (
                  <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed bg-slate-100/60 p-2 rounded-lg border border-slate-200/50">
                    {confirmDialog.subMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer ${
                  confirmDialog.confirmVariant === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : confirmDialog.confirmVariant === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
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
