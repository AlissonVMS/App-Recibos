import React from 'react';
import { ContractConfig, PaymentRecord } from '../types';
import {
  formatarNumeroMoeda,
  MESES_PT_BR,
  valorPorExtenso,
} from '../utils/numberToWordsPtBr';
import { extrairDadosTransferencia } from '../utils/transferHelper';
import { formatarBancoCompe } from '../data/bacenBanks';

interface ReceiptDocumentProps {
  payment: PaymentRecord;
  contract: ContractConfig;
  onPrint?: () => void;
}

export const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({
  payment,
  contract,
}) => {
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

  const transferInfo = extrairDadosTransferencia(payment, contract);
  const isEspecie =
    payment.formaPgto?.toUpperCase().includes('ESPÉCIE') ||
    payment.formaPgto?.toUpperCase().includes('ESPECIE');

  const bancoExibicao = formatarBancoCompe(payment.banco);

  // Sanitiza o título do contrato para garantir que ", firmado em..." nunca seja duplicado
  const tituloContratoLimpo = (contract.tituloContrato || 'Contrato de Promessa de Cessão de Direitos Hereditários')
    .replace(/,?\s*firmado\s+em.*$/i, '')
    .replace(/\.$/, '')
    .trim();

  return (
    <div className="flex flex-col items-center w-full">
      {/* 
        FOLHA A4 - LAYOUT 100% EXATO AO RECIBO SIMPLES.DOCM
        - Margem Superior: 3,0 cm
        - Margem Esquerda: 3,0 cm
        - Margem Direita: 2,0 cm
        - Margem Inferior: 2,0 cm
        - Tipografia: Times New Roman 12pt com espaçamento de 1,5 (Título 14pt)
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
          {transferInfo.isTransfer ? (
            <>
              Pagamento recebido através de <strong>{transferInfo.descricaoTipo}</strong>, creditado no banco <strong>{transferInfo.bancoNomePuro}</strong>{transferInfo.agencia && transferInfo.conta ? (
                <>, Agência número {transferInfo.agencia} e Conta {transferInfo.tipoContaFormatada} de número {transferInfo.conta}</>
              ) : transferInfo.agencia ? (
                <>, Agência número {transferInfo.agencia}</>
              ) : transferInfo.conta ? (
                <>, Conta {transferInfo.tipoContaFormatada} de número {transferInfo.conta}</>
              ) : null}.
            </>
          ) : isEspecie ? (
            <>
              Pagamento recebido <strong>em espécie (moeda corrente nacional)</strong>.
            </>
          ) : (
            <>
              Pagamento recebido através da <strong>chave&nbsp;Pix&nbsp;nº&nbsp;{payment.chave}, {bancoExibicao}</strong>.
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
