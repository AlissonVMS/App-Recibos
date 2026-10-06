import React, { useState } from 'react';
import { ContractConfig, PaymentRecord } from '../types';
import {
  formatarNumeroMoeda,
  MESES_PT_BR,
  valorPorExtenso,
} from '../utils/numberToWordsPtBr';
import { Printer, Download, Copy, Check, FileCheck, AlertCircle } from 'lucide-react';
import { baixarPdfRecibo, gerarNomeArquivoRecibo } from '../utils/pdfGenerator';

interface ReceiptDocumentProps {
  payment: PaymentRecord;
  contract: ContractConfig;
  onPrint?: () => void;
}

export const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({
  payment,
  contract,
  onPrint,
}) => {
  const [copied, setCopied] = useState(false);

  const valorFormatado = formatarNumeroMoeda(payment.valor);
  const saldoFormatado = formatarNumeroMoeda(payment.saldo);
  const valorExtenso = valorPorExtenso(payment.valor);
  const saldoExtenso = valorPorExtenso(payment.saldo);

  // Formata data DD/MM/AAAA
  let diaStr = payment.dia.padStart(2, '0');
  let mesStr = '';
  let anoStr = payment.ano;
  if (payment.data && payment.data.includes('-')) {
    const parts = payment.data.split('-');
    anoStr = parts[0];
    mesStr = parts[1];
    diaStr = parts[2];
  } else {
    const mesIndex = MESES_PT_BR.indexOf(payment.mes.toLowerCase());
    mesStr = (mesIndex >= 0 ? mesIndex + 1 : 1).toString().padStart(2, '0');
  }
  const dataPtBr = `${diaStr}/${mesStr}/${anoStr}`;

  // Nome padronizado do arquivo (sempre em maiúsculo)
  const nomePadraoArquivo = gerarNomeArquivoRecibo(payment);

  const isTed = payment.formaPgto?.toUpperCase().includes('TED');
  const isEspecie =
    payment.formaPgto?.toUpperCase().includes('ESPÉCIE') ||
    payment.formaPgto?.toUpperCase().includes('ESPECIE');

  let fraseFormaPgto = `Pagamento recebido através da chave Pix nº ${payment.chave}, ${payment.banco}.`;
  if (isTed) {
    fraseFormaPgto = `Pagamento recebido através de transferência bancária (TED), ${payment.banco} (${payment.chave}).`;
  } else if (isEspecie) {
    fraseFormaPgto = 'Pagamento recebido em espécie (moeda corrente nacional).';
  }

  // Sanitiza o título do contrato para garantir que ", firmado em..." nunca seja duplicado
  const tituloContratoLimpo = (contract.tituloContrato || 'Contrato de Promessa de Cessão de Direitos Hereditários')
    .replace(/,?\s*firmado\s+em.*$/i, '')
    .replace(/\.$/, '')
    .trim();

  const textoCompleto = `Recibo de Pagamento

1ª VIA

Eu, ${payment.nome}, inscrito(a) no CPF nº ${payment.cpf}, declaro que recebi de ${contract.pagadorNome}, CPF nº ${contract.pagadorCpf}, a quantia de R$ ${valorFormatado} (${valorExtenso}), no dia ${dataPtBr}, referente à parcela nº ${payment.parcela} do ${tituloContratoLimpo}, firmado em 19 de agosto de 2025.

${fraseFormaPgto}

Após este pagamento, o saldo devedor atualizado referente à minha parte é de R$ ${saldoFormatado} (${saldoExtenso}).

Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.

${payment.cidadeUf}, ${payment.dia} de ${payment.mes} de ${payment.ano}








____________________________________________________________________________________________________
${payment.nome}
CPF: ${payment.cpf}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textoCompleto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {payment.status === 'PREVISTO' && (
        <div className="w-full max-w-[210mm] mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900 print:hidden">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Aviso Legal:</strong> Esta parcela está com status <strong>PREVISTO</strong> (não quitada). Recibos de quitação plena só podem ser emitidos após o pagamento efetivo (status PAGO).
          </span>
        </div>
      )}

      {/* Top Action Toolbar (Oculto na impressão) */}
      <div className="w-full max-w-[210mm] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-2 print:hidden">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Nome Padrão do Arquivo:
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 tracking-tight">
              {nomePadraoArquivo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            title="Copiar texto exato do recibo"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </button>
          <button
            onClick={handlePrint}
            disabled={payment.status === 'PREVISTO'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={payment.status === 'PREVISTO' ? 'Impossível imprimir recibo de parcela não quitada' : 'Imprimir documento'}
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Imprimir
          </button>
          <button
            onClick={() => baixarPdfRecibo(payment, contract)}
            disabled={payment.status === 'PREVISTO'}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={payment.status === 'PREVISTO' ? 'Recibos só podem ser emitidos após o pagamento com status PAGO' : 'Baixar em formato PDF idêntico ao .docm'}
          >
            <Download className="w-3.5 h-3.5" />
            Baixar PDF
          </button>
        </div>
      </div>

      {/* 
        FOLHA A4 - LAYOUT 100% EXATO AO RECIBO SIMPLES.DOCM
        - Margem Superior: 3,0 cm
        - Margem Esquerda: 3,0 cm
        - Margem Direita: 2,0 cm
        - Margem Inferior: 2,0 cm
        - Tipografia: Times New Roman 12pt com espaçamento de 1,5 (Título 14pt)
        - Espaçamentos exatos em 'enters' conforme especificado:
          Recibo de Pagamento (fonte 14)
          1 enter
          1ª VIA
          2 enter
          Eu, ...
          1 enter
          Pagamento recebido...
          1 enter
          Após ...
          1 enter
          Para maior ...
          4 enter
          Local, data ...
          7 enter
          Linha de assinatura no 8 enter (textwidth 1)
          nome
          cpf
      */}
      <div
        id="receipt-print-area"
        lang="pt-BR"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 text-black select-text"
        style={{
          fontFamily: '"Times New Roman", Times, Georgia, serif',
          paddingTop: '30mm',
          paddingLeft: '30mm',
          paddingRight: '20mm',
          paddingBottom: '20mm',
          boxSizing: 'border-box',
          lineHeight: '1.5',
          textRendering: 'optimizeLegibility',
          fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Recibo de Pagamento (fonte 14, negrito, centralizado) */}
        <p className="text-center font-bold text-[14pt] leading-[1.5] m-0 p-0 tracking-tight">
          Recibo de Pagamento
        </p>

        {/* 1 enter */}
        <div style={{ height: '1.5em' }}></div>

        {/* 1ª VIA (fonte 12, negrito, alinhado à direita) */}
        <p className="text-right font-bold text-[12pt] leading-[1.5] m-0 p-0">
          1ª VIA
        </p>

        {/* 2 enter */}
        <div style={{ height: '3.0em' }}></div>

        {/* Eu, ... (fonte 12, justificado, espaçamento 1,5 com microtipografia LaTeX) */}
        <p
          className="text-justify text-[12pt] leading-[1.5] m-0 p-0"
          style={{
            textAlign: 'justify',
            textJustify: 'inter-word',
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            letterSpacing: '-0.005em',
            wordSpacing: '0.015em',
          }}
        >
          Eu, <strong>{payment.nome}</strong>, inscrito(a) no CPF&nbsp;nº&nbsp;<strong>{payment.cpf}</strong>, declaro que recebi de <strong>{contract.pagadorNome}</strong>, CPF&nbsp;nº&nbsp;<strong>{contract.pagadorCpf}</strong>, a quantia de&nbsp;<strong>R$&nbsp;{valorFormatado} ({valorExtenso})</strong>, no dia&nbsp;<strong>{dataPtBr}</strong>, referente à&nbsp;<strong>parcela&nbsp;nº&nbsp;{payment.parcela} do&nbsp;{tituloContratoLimpo}</strong>, firmado em&nbsp;<strong>19&nbsp;de&nbsp;agosto&nbsp;de&nbsp;2025</strong>.
        </p>

        {/* 1 enter */}
        <div style={{ height: '1.5em' }}></div>

        {/* Pagamento recebido... (fonte 12, justificado, espaçamento 1,5 com microtipografia LaTeX) */}
        <p
          className="text-justify text-[12pt] leading-[1.5] m-0 p-0"
          style={{
            textAlign: 'justify',
            textJustify: 'inter-word',
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            letterSpacing: '-0.005em',
            wordSpacing: '0.015em',
          }}
        >
          {isTed ? (
            <>
              Pagamento recebido através de <strong>transferência bancária (TED), {payment.banco} ({payment.chave})</strong>.
            </>
          ) : isEspecie ? (
            <>
              Pagamento recebido <strong>em espécie (moeda corrente nacional)</strong>.
            </>
          ) : (
            <>
              Pagamento recebido através da <strong>chave&nbsp;Pix&nbsp;nº&nbsp;{payment.chave}, {payment.banco}</strong>.
            </>
          )}
        </p>

        {/* 1 enter */}
        <div style={{ height: '1.5em' }}></div>

        {/* Após ... (fonte 12, justificado, espaçamento 1,5 com microtipografia LaTeX) */}
        <p
          className="text-justify text-[12pt] leading-[1.5] m-0 p-0"
          style={{
            textAlign: 'justify',
            textJustify: 'inter-word',
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            letterSpacing: '-0.005em',
            wordSpacing: '0.015em',
          }}
        >
          Após este pagamento, o saldo devedor atualizado referente à minha parte é de&nbsp;<strong>R$&nbsp;{saldoFormatado} ({saldoExtenso})</strong>.
        </p>

        {/* 1 enter */}
        <div style={{ height: '1.5em' }}></div>

        {/* Para maior ... (fonte 12, justificado, espaçamento 1,5 com microtipografia LaTeX) */}
        <p
          className="text-justify text-[12pt] leading-[1.5] m-0 p-0"
          style={{
            textAlign: 'justify',
            textJustify: 'inter-word',
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            letterSpacing: '-0.005em',
            wordSpacing: '0.015em',
          }}
        >
          Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo <strong>quitação plena, geral e irrevogável</strong> pela quantia recebida.
        </p>

        {/* 4 enter */}
        <div style={{ height: '6.0em' }}></div>

        {/* Local, data ... (fonte 12, negrito, alinhado à direita) */}
        <p className="text-right font-bold text-[12pt] leading-[1.5] m-0 p-0">
          {payment.cidadeUf}, {payment.dia}&nbsp;de&nbsp;{payment.mes}&nbsp;de&nbsp;{payment.ano}
        </p>

        {/* 7 enter */}
        <div style={{ height: '10.5em' }}></div>

        {/* Linha de assinatura no 8 enter (textwidth de 1 - 100% da margem útil) */}
        <div className="w-full border-t border-black mb-1"></div>

        {/* nome (fonte 12, negrito, centralizado) */}
        <p className="text-center font-bold text-[12pt] leading-[1.5] m-0 p-0">
          {payment.nome}
        </p>

        {/* cpf (fonte 12, centralizado) */}
        <p className="text-center text-[12pt] leading-[1.5] m-0 p-0">
          CPF: <strong>{payment.cpf}</strong>
        </p>
      </div>
    </div>
  );
};
