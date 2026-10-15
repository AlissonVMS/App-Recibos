import { PaymentRecord } from '../types';
import {
  formatarValorParaNomeArquivo,
  MESES_PT_BR,
} from './numberToWordsPtBr';

export function sanitizarNomeArquivo(texto: string): string {
  return texto
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai a data no formato DD-MM-AAAA a partir dos dados do pagamento,
 * suportando tanto YYYY-MM-DD quanto dia/mes/ano textuais.
 */
export function extrairDataFormatadaPtBr(pagamento: {
  data?: string;
  dataPagamento?: string;
  dataPrevista?: string;
  dia?: string | number;
  mes?: string | number;
  ano?: string | number;
}): string {
  let dia = '';
  let mesNum = '';
  let ano = '';

  const rawDate = (pagamento.dataPagamento || pagamento.dataPrevista || pagamento.data || '').trim();
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        ano = parts[0];
        mesNum = parts[1];
        dia = parts[2];
      } else {
        // DD-MM-YYYY
        dia = parts[0];
        mesNum = parts[1];
        ano = parts[2];
      }
    }
  } else if (rawDate.includes('/')) {
    const parts = rawDate.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        ano = parts[0];
        mesNum = parts[1];
        dia = parts[2];
      } else {
        // DD/MM/YYYY
        dia = parts[0];
        mesNum = parts[1];
        ano = parts[2];
      }
    }
  }

  if (!dia && pagamento.dia) dia = String(pagamento.dia).trim();
  if (!ano && pagamento.ano) ano = String(pagamento.ano).trim();

  if (!mesNum && pagamento.mes) {
    const mesStr = String(pagamento.mes).trim().toLowerCase();
    const num = parseInt(mesStr, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      mesNum = num.toString().padStart(2, '0');
    } else {
      const idx = MESES_PT_BR.indexOf(mesStr);
      mesNum = (idx >= 0 ? idx + 1 : 1).toString().padStart(2, '0');
    }
  }

  dia = (dia || '01').padStart(2, '0');
  mesNum = (mesNum || '01').padStart(2, '0');
  ano = ano || String(new Date().getFullYear());

  return `${dia}-${mesNum}-${ano}`;
}

/**
 * Nome padrão do arquivo do recibo conforme especificação estrita do usuário:
 * Ex: "RECIBO ELISANGELA M V DE ARAÚJO P12 R$1000,00 10-08-2026.pdf"
 * Padrão: RECIBO {NOME} P{XX} R${VALOR} {DD-MM-AAAA}.pdf (apenas PXX, sem a palavra "Parcela").
 */
export function gerarNomeArquivoRecibo(
  pagamento: PaymentRecord,
  sufixo: number = 0
): string {
  const nomeUpper = (pagamento.nome || '').replace(/\s+/g, ' ').trim().toUpperCase();
  const numParcela = String(pagamento.parcela ?? '').replace(/\D+/g, '') || String(pagamento.parcela ?? '1');
  const parcelaUpper = `P${numParcela}`;
  const valorFormatado = `R$${formatarValorParaNomeArquivo(pagamento.valor)}`;
  const dataFormatada = extrairDataFormatadaPtBr(pagamento);

  const base = `RECIBO ${nomeUpper} ${parcelaUpper} ${valorFormatado} ${dataFormatada}`.toUpperCase();
  const limpo = sanitizarNomeArquivo(base);
  return sufixo > 0 ? `${limpo} (${sufixo}).pdf` : `${limpo}.pdf`;
}

/**
 * Gera o nome de arquivo padronizado para lote de recibos (.zip):
 * - 1 parcela: "RECIBOS P13 11-07-2026.zip"
 * - Intervalo contínuo: "RECIBOS P11 A 15 DE 11-05 A 11-09-2026.zip"
 * - Intervalos mistos: "RECIBOS P11, 13 E 15 DE 11-05 A 11-09-2026.zip"
 * - Parcelas mistas na mesma data: "RECIBOS P11, 13 E 15 11-07-2026.zip"
 */
export function gerarNomeArquivoLote(pagamentos: PaymentRecord[]): string {
  const pagos = pagamentos.filter((p) => (p.status?.toString().toUpperCase() || 'PAGO') === 'PAGO');
  if (pagos.length === 0) return 'RECIBOS.zip';

  // 1. Parcelas únicas ordenadas
  const parcelas = Array.from(new Set(pagos.map((p) => p.parcela))).sort((a, b) => a - b);

  let parcelasStr = '';
  if (parcelas.length === 1) {
    parcelasStr = `P${parcelas[0]}`;
  } else {
    // Verifica se é uma sequência contínua (ex: 11, 12, 13, 14, 15)
    let isContinua = true;
    for (let i = 0; i < parcelas.length - 1; i++) {
      if (parcelas[i + 1] !== parcelas[i] + 1) {
        isContinua = false;
        break;
      }
    }

    if (isContinua && parcelas.length > 2) {
      parcelasStr = `P${parcelas[0]} A ${parcelas[parcelas.length - 1]}`;
    } else if (parcelas.length === 2) {
      parcelasStr = `P${parcelas[0]} E ${parcelas[1]}`;
    } else {
      const ini = parcelas.slice(0, -1).join(', ');
      const fim = parcelas[parcelas.length - 1];
      parcelasStr = `P${ini} E ${fim}`;
    }
  }

  // 2. Datas dos pagamentos
  interface DataParsed {
    iso: string; // YYYY-MM-DD
    dia: string;
    mes: string;
    ano: string;
  }

  const datasParsed: DataParsed[] = pagos.map((p) => {
    const formatted = extrairDataFormatadaPtBr(p);
    const [dia, mes, ano] = formatted.split('-');
    return {
      iso: `${ano}-${mes}-${dia}`,
      dia,
      mes,
      ano,
    };
  });

  // Ordena por data cronológica
  datasParsed.sort((a, b) => a.iso.localeCompare(b.iso));

  const uniqueIso = Array.from(new Set(datasParsed.map((d) => d.iso)));
  let datasStr = '';

  if (uniqueIso.length === 1) {
    const d = datasParsed[0];
    datasStr = `${d.dia}-${d.mes}-${d.ano}`;
  } else {
    const dIni = datasParsed[0];
    const dFim = datasParsed[datasParsed.length - 1];

    if (dIni.ano === dFim.ano) {
      datasStr = `DE ${dIni.dia}-${dIni.mes} A ${dFim.dia}-${dFim.mes}-${dFim.ano}`;
    } else {
      datasStr = `DE ${dIni.dia}-${dIni.mes}-${dIni.ano} A ${dFim.dia}-${dFim.mes}-${dFim.ano}`;
    }
  }

  const base = `RECIBOS ${parcelasStr} ${datasStr}`.toUpperCase();
  return `${sanitizarNomeArquivo(base)}.zip`;
}
