/**
 * Converte valor numérico em reais por extenso (Português do Brasil)
 * Ex: 1000 -> "mil reais"
 *     8500 -> "oito mil e quinhentos reais"
 *     500 -> "quinhentos reais"
 *     10000 -> "dez mil reais"
 */

const UNIDADES = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];

const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];

const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function converterGrupo(num: number): string {
  if (num === 0) return '';
  if (num === 100) return 'cem';

  const c = Math.floor(num / 100);
  const d = Math.floor((num % 100) / 10);
  const u = num % 10;
  const parts: string[] = [];

  if (c > 0) {
    parts.push(CENTENAS[c]);
  }

  const resto = num % 100;
  if (resto > 0) {
    if (resto < 20) {
      parts.push(UNIDADES[resto]);
    } else {
      parts.push(DEZENAS[d]);
      if (u > 0) {
        parts.push(UNIDADES[u]);
      }
    }
  }

  return parts.join(' e ');
}

export function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const inteiro = Math.floor(Math.abs(valor));
  const centavos = Math.round((Math.abs(valor) - inteiro) * 100);

  const milhoes = Math.floor(inteiro / 1000000);
  const milhares = Math.floor((inteiro % 1000000) / 1000);
  const unidades = inteiro % 1000;

  const partes: string[] = [];

  if (milhoes > 0) {
    if (milhoes === 1) {
      partes.push('um milhão');
    } else {
      partes.push(`${converterGrupo(milhoes)} milhões`);
    }
  }

  if (milhares > 0) {
    if (milhares === 1) {
      partes.push('mil');
    } else {
      partes.push(`${converterGrupo(milhares)} mil`);
    }
  }

  if (unidades > 0) {
    partes.push(converterGrupo(unidades));
  }

  let textoReais = '';
  if (inteiro > 0) {
    const nomeReais = inteiro === 1 ? 'real' : 'reais';
    textoReais = `${partes.join(' e ')} ${nomeReais}`;
  }

  let textoCentavos = '';
  if (centavos > 0) {
    const nomeCentavos = centavos === 1 ? 'centavo' : 'centavos';
    textoCentavos = `${converterGrupo(centavos)} ${nomeCentavos}`;
  }

  if (textoReais && textoCentavos) {
    return `${textoReais} e ${textoCentavos}`;
  } else if (textoReais) {
    return textoReais;
  } else if (textoCentavos) {
    return textoCentavos;
  }

  return 'zero reais';
}

/** Formata para o texto do documento: 1.000,00 ou 8.500,00 */
export function formatarNumeroMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/** Formata padrão R$ com espaço para a UI */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/** Formata especificamente para o nome do arquivo padrão solicitado pelo usuário:
 *  Ex: 1000 -> "1000,00", 500 -> "500,00", 10000 -> "10000,00"
 */
export function formatarValorParaNomeArquivo(valor: number): string {
  const inteiro = Math.floor(Math.abs(valor));
  const centavos = Math.round((Math.abs(valor) - inteiro) * 100);
  return `${inteiro},${centavos.toString().padStart(2, '0')}`;
}

export function formatarDataPtBr(dataStr: string): string {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  if (!dia || !mes || !ano) return dataStr;
  return `${dia}/${mes}/${ano}`;
}

/** Formata valor numérico para input monetário brasileiro com separadores (ex: 1000 -> "1.000,00") */
export function formatarInputMoeda(valor: number): string {
  if (isNaN(valor) || valor === 0) return '0,00';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/** Converte texto digitado pelo usuário (com pontos e vírgulas) para número:
 *  Ex: "1.000,00" -> 1000
 *      "500,50" -> 500.5
 */
export function parseInputMoeda(texto: string): number {
  if (!texto) return 0;
  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return 0;
  return Number(digitos) / 100;
}

export const MESES_PT_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
