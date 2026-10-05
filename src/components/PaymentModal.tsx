import React, { useState, useEffect } from 'react';
import { Beneficiary, PaymentRecord } from '../types';
import {
  MESES_PT_BR,
  formatarInputMoeda,
  parseInputMoeda,
  valorPorExtenso,
} from '../utils/numberToWordsPtBr';
import {
  X,
  Save,
  AlertCircle,
  ChevronDown,
  Landmark,
  QrCode,
  Banknote,
  UserCheck,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: PaymentRecord) => void;
  beneficiaries: Beneficiary[];
  existingPayment?: PaymentRecord | null;
  existingPayments: PaymentRecord[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  beneficiaries,
  existingPayment,
  existingPayments,
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [valor, setValor] = useState<number>(1000);
  const [valorInput, setValorInput] = useState<string>('1.000,00');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);

  // Forma de pagamento (PIX, TED, ESPÉCIE)
  const [formaPgto, setFormaPgto] = useState<'PIX' | 'TED' | 'ESPÉCIE'>('PIX');

  useEffect(() => {
    if (existingPayment) {
      const ben = beneficiaries.find((b) => b.nome === existingPayment.nome);
      if (ben) {
        setSelectedBeneficiaryId(ben.id);
      }
      setValor(existingPayment.valor);
      setValorInput(formatarInputMoeda(existingPayment.valor));
      setData(existingPayment.dataPagamento || existingPayment.data);

      const fPgto = (existingPayment.formaPgto || 'PIX').toUpperCase();
      if (fPgto.includes('TED') || fPgto.includes('TRANSFER')) {
        setFormaPgto('TED');
      } else if (fPgto.includes('ESPÉCIE') || fPgto.includes('DINHEIRO')) {
        setFormaPgto('ESPÉCIE');
      } else {
        setFormaPgto('PIX');
      }
    } else {
      // Pré-seleciona primeiro beneficiário
      if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
        setSelectedBeneficiaryId(beneficiaries[0].id);
      }
    }
  }, [existingPayment, isOpen, beneficiaries]);

  const currentBeneficiary =
    beneficiaries.find((b) => b.id === selectedBeneficiaryId) || beneficiaries[0];

  // Tratamento da digitação de valor monetário no padrão Real (R$ 1.000,00)
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInputMoeda(raw);
    setValor(num);
    setValorInput(formatarInputMoeda(num));
  };

  if (!isOpen || !currentBeneficiary) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ben = currentBeneficiary;

    const [ano, mesNum, dia] = data.split('-');
    const mesIndex = parseInt(mesNum, 10) - 1;
    const mesNome = MESES_PT_BR[mesIndex] || '';

    // Número da parcela é preservado ou sequenciado automaticamente
    const parcelaCalculada = existingPayment
      ? existingPayment.parcela
      : existingPayments
          .filter((p) => p.nome === ben.nome)
          .reduce((max, p) => Math.max(max, p.parcela), 0) + 1;

    // Saldo é preservado ou calculado automaticamente
    const saldoCalculado = existingPayment
      ? existingPayment.saldo
      : Math.max(0, ben.saldo - valor);

    const statusCalculado = existingPayment?.status || 'PAGO';

    // Os dados bancários e de identificação são puxados diretamente do cadastro do cedente
    let chaveFinal = ben.chavePix || '-';
    let bancoFinal = ben.banco || '-';

    if (formaPgto === 'TED') {
      chaveFinal = `Agência: ${ben.agencia || '-'} / Conta: ${ben.conta || '-'} (${ben.tipoConta || 'Conta'})`;
      bancoFinal = ben.banco || '-';
    } else if (formaPgto === 'ESPÉCIE') {
      chaveFinal = 'Recibo presencial / Moeda corrente';
      bancoFinal = 'Moeda corrente nacional';
    }

    const updatedOrNewPayment: PaymentRecord = {
      id: existingPayment ? existingPayment.id : `pg-${Date.now()}`,
      nome: ben.nome,
      cpf: ben.cpf,
      parcela: parcelaCalculada,
      valor: Number(valor),
      data, // A data de registro é a data de pagamento
      dataPagamento: statusCalculado === 'PAGO' ? data : existingPayment?.dataPagamento,
      dataPrevista: existingPayment?.dataPrevista || data,
      status: statusCalculado,
      formaPgto,
      chave: chaveFinal,
      tipoChavePix: formaPgto === 'PIX' ? ben.tipoChavePix || 'CPF' : undefined,
      banco: bancoFinal,
      saldo: saldoCalculado,
      dia: dia.padStart(2, '0'),
      mes: mesNome,
      ano,
      cidadeUf: ben.cidadeUf || 'Maceió - AL',
    };

    onSave(updatedOrNewPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {existingPayment
                ? `Editar Pagamento (Parcela nº ${existingPayment.parcela})`
                : 'Registrar Novo Pagamento'}
            </h2>
            <p className="text-xs text-slate-300">
              Dados financeiros da parcela vinculados ao cadastro do cedente
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Seleção do Beneficiário */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Beneficiário / Cedente *
            </label>
            <div className="relative">
              <select
                value={selectedBeneficiaryId}
                onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                className="w-full text-sm font-semibold text-slate-900 rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-10 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 appearance-none"
                required
              >
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome} (CPF: {b.cpf})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Valor do Pagamento e Data do Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Valor do Pagamento *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valorInput}
                  onChange={handleValorChange}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-lg border-slate-300 bg-slate-50 border focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-right"
                  placeholder="0,00"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 italic block mt-1 truncate">
                {valorPorExtenso(valor)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Data do Pagamento *
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 border py-2 px-3 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Forma de Pagamento (Chevron entre TED, PIX ou ESPÉCIE) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Forma de Pagamento *
            </label>
            <div className="relative">
              <select
                value={formaPgto}
                onChange={(e) =>
                  setFormaPgto(e.target.value as 'PIX' | 'TED' | 'ESPÉCIE')
                }
                className="w-full text-sm font-bold text-slate-800 rounded-lg border-slate-300 bg-slate-50 border p-2.5 pr-10 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 appearance-none"
              >
                <option value="PIX">PIX (Transferência Instantânea)</option>
                <option value="TED">TED (Transferência Bancária)</option>
                <option value="ESPÉCIE">ESPÉCIE (Pagamento em Dinheiro)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Informações Condicionais de Pagamento - Puxadas Diretamente do Cadastro (Somente Leitura) */}
          {formaPgto === 'PIX' && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Dados Cadastrados do PIX</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tipo de Chave
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {currentBeneficiary.tipoChavePix || 'CPF'}
                  </span>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Chave PIX
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5 truncate select-all">
                    {currentBeneficiary.chavePix || 'Não cadastrada'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Banco Recebedor
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {currentBeneficiary.banco || 'Não informado'}
                </span>
              </div>
            </div>
          )}

          {formaPgto === 'TED' && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Dados Bancários Cadastrados para TED</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Banco Recebedor
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {currentBeneficiary.banco || 'Não informado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Agência
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 block mt-0.5">
                    {currentBeneficiary.agencia || '-'}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Conta ({currentBeneficiary.tipoConta || 'Corrente'})
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 block mt-0.5">
                    {currentBeneficiary.conta || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {formaPgto === 'ESPÉCIE' && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Banknote className="w-4 h-4 text-amber-600" />
                <span>Pagamento Presencial em Espécie</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Pagamento em moeda corrente nacional entregue diretamente em mãos a{' '}
                <strong>{currentBeneficiary.nome}</strong>. A quitação plena é formalizada com a assinatura no recibo físico.
              </p>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <UserCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <p>
              Os dados bancários e identificadores refletem o cadastro central do cedente. Para alterar banco ou chave PIX, utilize a aba Gestão de Contrato ou Edição do Cedente.
            </p>
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
              Salvar Pagamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
