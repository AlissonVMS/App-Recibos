import { ContractConfig, PaymentRecord, Beneficiary } from '../types';
import { extrairCodigoCompe, extrairNomePuroBanco, formatarBancoCompe } from '../data/bacenBanks';

export interface TransferInfo {
  isTransfer: boolean;
  tipo: 'TEV' | 'TED';
  descricaoTipo: string;
  bancoFormatado: string;
  bancoNomePuro: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  tipoContaFormatada: string;
  detalhesTexto: string;
  detalhesHtml: string;
  texto: string;
  textoHtml: string;
}

/**
 * Determina se o pagamento foi realizado via transferência bancária (TED ou TEV),
 * compara o banco do pagador com o banco do cedente/beneficiário,
 * e gera a redação exata solicitada:
 *
 * Em caso de pagamento para o mesmo banco:
 * "Pagamento recebido através de TEV (Transferência Eletrônica de Valores), creditado no banco Caixa Econômica Federal, Agência número 3693 e Conta Poupança de número 786779864-2."
 *
 * Para outros bancos:
 * "Pagamento recebido através de TED (Transferência Eletrônica Disponível), creditado no banco [Nome Banco], Agência número [agência] e Conta [TipoConta] de número [conta]."
 */
export function extrairDadosTransferencia(
  pagamento: PaymentRecord,
  contrato?: ContractConfig,
  beneficiario?: Beneficiary
): TransferInfo {
  const forma = (pagamento.formaPgto || '').toUpperCase();
  const isTransfer =
    forma.includes('TED') ||
    forma.includes('TEV') ||
    forma.includes('TRANSFER');

  // Banco do pagador (padrão: 104 - Caixa Econômica Federal)
  const pagadorBancoStr = contrato?.pagadorBanco || '104 - Caixa Econômica Federal';
  const pagadorCompe = extrairCodigoCompe(pagadorBancoStr) || '104';

  // Banco do recebedor
  const recebedorBancoRaw =
    beneficiario?.banco || pagamento.banco || '104 - Caixa Econômica Federal';
  const recebedorBancoFormatado = formatarBancoCompe(recebedorBancoRaw);
  const recebedorCompe = extrairCodigoCompe(recebedorBancoFormatado);
  const bancoNomePuro = extrairNomePuroBanco(recebedorBancoRaw);

  // Agência, Conta e Tipo de Conta
  let agencia = beneficiario?.agencia || '';
  let conta = beneficiario?.conta || '';
  let tipoConta = (beneficiario?.tipoConta || 'POUPANÇA').toUpperCase();

  // Se não constar no beneficiário, tenta extrair do campo chave do pagamento
  if (!agencia || !conta) {
    const chave = pagamento.chave || '';
    const agMatch = chave.match(/ag[eê]ncia:?\s*([0-9-]+)/i);
    const ccMatch = chave.match(/conta:?\s*([0-9-]+)/i);
    const tipoMatch = chave.match(/\(([^)]+)\)/);

    if (agMatch) agencia = agMatch[1];
    if (ccMatch) conta = ccMatch[1];
    if (tipoMatch) tipoConta = tipoMatch[1].toUpperCase();
  }

  // Verifica se é o mesmo banco
  let isMesmoBanco = false;
  if (pagadorCompe && recebedorCompe && pagadorCompe === recebedorCompe) {
    isMesmoBanco = true;
  } else {
    const pagLower = pagadorBancoStr.toLowerCase();
    const recLower = recebedorBancoRaw.toLowerCase();
    if (
      (pagLower.includes('caixa') && recLower.includes('caixa')) ||
      (pagLower.includes('brasil') && recLower.includes('brasil')) ||
      (pagLower.includes('bradesco') && recLower.includes('bradesco')) ||
      (pagLower.includes('itaú') && recLower.includes('itaú')) ||
      (pagLower.includes('itau') && recLower.includes('itau')) ||
      (pagLower.includes('santander') && recLower.includes('santander')) ||
      (pagLower.includes('nubank') && recLower.includes('nu'))
    ) {
      isMesmoBanco = true;
    }
  }

  const tipo: 'TEV' | 'TED' = isMesmoBanco ? 'TEV' : 'TED';
  const descricaoTipo = isMesmoBanco
    ? 'TEV (Transferência Eletrônica de Valores)'
    : 'TED (Transferência Eletrônica Disponível)';

  const tipoContaFormatada = tipoConta.includes('POUP') ? 'Poupança' : 'Corrente';

  let detalhesTexto = '';
  let detalhesHtml = '';

  if (agencia && conta) {
    detalhesTexto = `, Agência número ${agencia} e Conta ${tipoContaFormatada} de número ${conta}`;
    detalhesHtml = `, Agência número <strong>${agencia}</strong> e Conta ${tipoContaFormatada} de número <strong>${conta}</strong>`;
  } else if (agencia) {
    detalhesTexto = `, Agência número ${agencia}`;
    detalhesHtml = `, Agência número <strong>${agencia}</strong>`;
  } else if (conta) {
    detalhesTexto = `, Conta ${tipoContaFormatada} de número ${conta}`;
    detalhesHtml = `, Conta ${tipoContaFormatada} de número <strong>${conta}</strong>`;
  }

  const texto = `Pagamento recebido através de ${descricaoTipo}, creditado no banco ${bancoNomePuro}${detalhesTexto}.`;
  const textoHtml = `Pagamento recebido através de <strong>${descricaoTipo}</strong>, creditado no banco <strong>${bancoNomePuro}</strong>${detalhesHtml}.`;

  return {
    isTransfer,
    tipo,
    descricaoTipo,
    bancoFormatado: recebedorBancoFormatado,
    bancoNomePuro,
    agencia,
    conta,
    tipoConta,
    tipoContaFormatada,
    detalhesTexto,
    detalhesHtml,
    texto,
    textoHtml,
  };
}
