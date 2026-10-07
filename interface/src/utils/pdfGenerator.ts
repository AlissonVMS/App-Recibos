import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { ContractConfig, PaymentRecord } from '../types';
import {
  formatarNumeroMoeda,
  formatarValorParaNomeArquivo,
  MESES_PT_BR,
  valorPorExtenso,
} from './numberToWordsPtBr';
import { extrairDadosTransferencia } from './transferHelper';
import { extrairNomePuroBanco } from '../data/bacenBanks';

export function sanitizarNomeArquivo(texto: string): string {
  return texto
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nome padrão do arquivo do recibo conforme especificação estrita do usuário:
 * Ex: "RECIBO ELINALDO MARQUES DA SILVA P11 R$1000,00 11-07-2026.pdf"
 * A estrutura é SEMPRE EM MAIÚSCULO.
 */
export function gerarNomeArquivoRecibo(
  pagamento: PaymentRecord,
  sufixo: number = 0
): string {
  const nomeUpper = pagamento.nome.trim().toUpperCase();
  const parcelaUpper = `P${pagamento.parcela}`.toUpperCase();
  const valorFormatado = `R$${formatarValorParaNomeArquivo(pagamento.valor)}`;

  let dia = pagamento.dia;
  let mesNum = '';
  let ano = pagamento.ano;

  if (pagamento.data && pagamento.data.includes('-')) {
    const parts = pagamento.data.split('-');
    ano = parts[0];
    mesNum = parts[1];
    dia = parts[2];
  } else {
    const mesIndex = MESES_PT_BR.indexOf(pagamento.mes.toLowerCase());
    mesNum = (mesIndex >= 0 ? mesIndex + 1 : 1).toString().padStart(2, '0');
  }

  const dataFormatada = `${dia.padStart(2, '0')}-${mesNum.padStart(2, '0')}-${ano}`;
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
    let dia = p.dia.padStart(2, '0');
    let mes = '';
    let ano = p.ano;

    const dataRef = p.dataPagamento || p.data;
    if (dataRef && dataRef.includes('-')) {
      const parts = dataRef.split('-');
      ano = parts[0];
      mes = parts[1].padStart(2, '0');
      dia = parts[2].padStart(2, '0');
    } else {
      const mesIndex = MESES_PT_BR.indexOf(p.mes.toLowerCase());
      mes = (mesIndex >= 0 ? mesIndex + 1 : 1).toString().padStart(2, '0');
    }

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

interface TextToken {
  text: string;
  bold: boolean;
}

interface WordToken {
  word: string;
  bold: boolean;
  width: number;
}

/**
 * Dicionário canônico de divisão silábica para termos recorrentes em recibos contratuais
 * conforme as regras do Acordo Ortográfico e estilo LaTeX (babel-portuges)
 */
const DICIONARIO_HIFENIZACAO: Record<string, string[]> = {
  hereditarios: ['he', 're', 'di', 'tá', 'rios'],
  hereditários: ['he', 're', 'di', 'tá', 'rios'],
  irrevogavel: ['ir', 're', 'vo', 'gá', 'vel'],
  irrevogável: ['ir', 're', 'vo', 'gá', 'vel'],
  concedendo: ['con', 'ce', 'den', 'do'],
  recebimento: ['re', 'ce', 'bi', 'men', 'to'],
  mencionado: ['men', 'cio', 'na', 'do'],
  declaro: ['de', 'cla', 'ro'],
  transferencia: ['trans', 'fe', 'rên', 'cia'],
  transferência: ['trans', 'fe', 'rên', 'cia'],
  atualizado: ['atua', 'li', 'za', 'do'],
  pagamento: ['pa', 'ga', 'men', 'to'],
  quitacao: ['qui', 'ta', 'ção'],
  quitação: ['qui', 'ta', 'ção'],
  promessa: ['pro', 'mes', 'sa'],
  contrato: ['con', 'tra', 'to'],
  quinhentos: ['qui', 'nhen', 'tos'],
  economica: ['eco', 'nô', 'mi', 'ca'],
  econômica: ['eco', 'nô', 'mi', 'ca'],
  referente: ['re', 'fe', 'ren', 'te'],
  inscrito: ['ins', 'cri', 'to'],
  'inscrito(a)': ['ins', 'cri', 'to(a)'],
  comprova: ['com', 'pro', 'va'],
  bancaria: ['ban', 'cá', 'ria'],
  bancária: ['ban', 'cá', 'ria'],
  especie: ['es', 'pé', 'cie'],
  espécie: ['es', 'pé', 'cie'],
  nacional: ['na', 'cio', 'nal'],
  corrente: ['cor', 'ren', 'te'],
  clareza: ['cla', 're', 'za'],
  presente: ['pre', 'sen', 'te'],
  integral: ['in', 'te', 'gral'],
  recebida: ['re', 'ce', 'bi', 'da'],
  devedor: ['de', 've', 'dor'],
  fevereiro: ['fe', 've', 'rei', 'ro'],
  agosto: ['agos', 'to'],
  abigail: ['abi', 'gail'],
};

/**
 * Obtém os possíveis pontos de hifenização de uma palavra em português (estilo LaTeX)
 */
function obterSilabasPtBr(palavra: string): string[] | null {
  const limpa = palavra.replace(/[.,;:()]/g, '').toLowerCase();
  if (DICIONARIO_HIFENIZACAO[limpa]) {
    return DICIONARIO_HIFENIZACAO[limpa];
  }

  // Fallback fonético para palavras longas (>= 7 caracteres)
  if (limpa.length >= 7) {
    const silabas: string[] = [];
    const vogais = 'aeiouáéíóúâêôãõü';
    let atual = '';
    for (let i = 0; i < limpa.length; i++) {
      atual += limpa[i];
      const c = limpa[i];
      const prox = limpa[i + 1];
      const depois = limpa[i + 2];

      if (vogais.includes(c) && prox && !vogais.includes(prox)) {
        if (depois && vogais.includes(depois)) {
          silabas.push(atual);
          atual = '';
        } else if (prox === 'r' && depois === 'r') {
          atual += 'r';
          i++;
          silabas.push(atual);
          atual = '';
        } else if (prox === 's' && depois === 's') {
          atual += 's';
          i++;
          silabas.push(atual);
          atual = '';
        }
      }
    }
    if (atual) {
      if (silabas.length > 0) {
        silabas[silabas.length - 1] += atual;
      } else {
        silabas.push(atual);
      }
    }
    if (silabas.length >= 2) return silabas;
  }

  return null;
}

/** Preposições e palavras curtas que não devem ficar órfãs no final da linha (estilo LaTeX tie ~) */
const PREPOSICOES_ORFAS = new Set(['e', 'a', 'à', 'de', 'do', 'da', 'o', 'ao', 'na', 'no', 'em']);

/**
 * Renderiza um parágrafo com microtipografia avançada e hifenização dinâmica inspirada no TeX/LaTeX:
 * - Evita espaçamentos exagerados ("rivers") através de quebra silábica ponderada
 * - Respeita espaços inquebráveis (\u00A0) para quantias monetárias, números de parcela e datas
 * - Aplica tolerância óptica de protrusão de caractere (margin kerning) para hífens e pontuação
 * - Impede preposições e monossílabos órfãos no fim da linha
 */
function renderizarParagrafoJustificado(
  doc: jsPDF,
  tokens: TextToken[],
  startX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  fontSize: number
): number {
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');
  const standardSpaceWidth = doc.getTextWidth(' ');

  // 1. Quebra tokens em palavras individuais preservando espaços inquebráveis (\u00A0)
  const rawTokens: WordToken[] = [];
  for (const token of tokens) {
    doc.setFont('times', token.bold ? 'bold' : 'normal');
    // Divide por espaços regulares ou quebras, mantendo blocos com \u00A0 unidos
    const segments = token.text.split(/([ \t\r\n]+)/);
    for (const seg of segments) {
      if (seg === '') continue;
      // Converte \u00A0 para medição real mas mantém como unidade única
      const cleanForMeasure = seg.replace(/\u00A0/g, ' ');
      rawTokens.push({
        word: seg,
        bold: token.bold,
        width: doc.getTextWidth(cleanForMeasure),
      });
    }
  }

  // 2. Agrupamento em linhas com avaliação dinâmica de espaçamento e hifenização (Knuth-Plass style)
  const lines: WordToken[][] = [];
  let currentLine: WordToken[] = [];
  let currentLineWidth = 0;

  for (let i = 0; i < rawTokens.length; i++) {
    const item = rawTokens[i];

    // Ignora espaços vazios no início da linha
    if (currentLine.length === 0 && item.word.trim() === '') {
      continue;
    }

    // Se cabe confortavelmente na linha corrente
    if (currentLineWidth + item.width <= maxWidth || currentLine.length === 0) {
      currentLine.push(item);
      currentLineWidth += item.width;
      continue;
    }

    // A palavra excede a largura da linha: avalia se a linha atual ficaria com espaçamento excessivo
    const nonSpaceInCurrent = currentLine.filter((w) => w.word.trim() !== '');
    const sumWidthCurrent = nonSpaceInCurrent.reduce((acc, w) => acc + w.width, 0);
    const gapsCount = Math.max(1, nonSpaceInCurrent.length - 1);
    const currentGapWidth = (maxWidth - sumWidthCurrent) / gapsCount;

    let hifenizado = false;

    // Se os espaços ficariam muito abertos (> 1.35x do padrão) e a palavra atual é hifenizável
    if (currentGapWidth > standardSpaceWidth * 1.35 && item.word.trim() !== '') {
      const silabas = obterSilabasPtBr(item.word);
      if (silabas && silabas.length >= 2) {
        doc.setFont('times', item.bold ? 'bold' : 'normal');
        // Testa os prefixos do mais longo para o mais curto
        for (let sIdx = silabas.length - 1; sIdx >= 1; sIdx--) {
          const prefixo = silabas.slice(0, sIdx).join('') + '-';
          const sufixo = silabas.slice(sIdx).join('');

          if (sufixo.length >= 2) {
            const prefixWidth = doc.getTextWidth(prefixo);
            // Tolerância óptica de 0.4mm para o hífen na margem direita
            if (currentLineWidth + prefixWidth <= maxWidth + 0.4) {
              // Aplica hifenização: prefixo entra na linha atual
              currentLine.push({
                word: prefixo,
                bold: item.bold,
                width: prefixWidth,
              });

              // Finaliza a linha atual
              lines.push(currentLine);

              // Inicia a próxima linha com o restante da palavra
              const suffixWidth = doc.getTextWidth(sufixo);
              currentLine = [
                {
                  word: sufixo,
                  bold: item.bold,
                  width: suffixWidth,
                },
              ];
              currentLineWidth = suffixWidth;
              hifenizado = true;
              break;
            }
          }
        }
      }
    }

    if (!hifenizado) {
      // Evita preposição ou palavra curta órfã no final da linha (ex: "e", "a", "de")
      if (currentLine.length > 2) {
        const lastNonSpaceIdx = currentLine.length - 1;
        const lastItem = currentLine[lastNonSpaceIdx];
        const lastWordClean = lastItem.word.trim().toLowerCase();

        if (PREPOSICOES_ORFAS.has(lastWordClean)) {
          // Move a preposição para a próxima linha
          currentLine.pop();
          lines.push(currentLine);

          if (item.word.trim() === '') {
            currentLine = [lastItem];
            currentLineWidth = lastItem.width;
          } else {
            currentLine = [
              lastItem,
              { word: ' ', bold: false, width: standardSpaceWidth },
              item,
            ];
            currentLineWidth = lastItem.width + standardSpaceWidth + item.width;
          }
          continue;
        }
      }

      // Fecha a linha normal
      while (currentLine.length > 0 && currentLine[currentLine.length - 1].word.trim() === '') {
        const removed = currentLine.pop()!;
        currentLineWidth -= removed.width;
      }
      lines.push(currentLine);

      if (item.word.trim() === '') {
        currentLine = [];
        currentLineWidth = 0;
      } else {
        currentLine = [item];
        currentLineWidth = item.width;
      }
    }
  }

  if (currentLine.length > 0) {
    while (currentLine.length > 0 && currentLine[currentLine.length - 1].word.trim() === '') {
      currentLine.pop();
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  // 3. Renderização precisa de cada linha com micro-espaçamento proporcional
  let currentY = startY;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const isLastLine = lineIdx === lines.length - 1;

    // Extrai palavras imprimíveis
    const nonSpaceWords: WordToken[] = [];
    let sumWordsWidth = 0;
    for (const item of line) {
      if (item.word.trim() !== '') {
        nonSpaceWords.push(item);
        sumWordsWidth += item.width;
      }
    }

    if (nonSpaceWords.length === 0) {
      currentY += lineHeight;
      continue;
    }

    let cursorX = startX;

    if (isLastLine || nonSpaceWords.length === 1) {
      // Última linha: alinhamento natural à esquerda
      for (let wIdx = 0; wIdx < nonSpaceWords.length; wIdx++) {
        const item = nonSpaceWords[wIdx];
        doc.setFont('times', item.bold ? 'bold' : 'normal');
        // Imprime convertendo qualquer espaço inquebrável para espaço visível
        doc.text(item.word.replace(/\u00A0/g, ' '), cursorX, currentY);
        cursorX += item.width + (wIdx < nonSpaceWords.length - 1 ? standardSpaceWidth : 0);
      }
    } else {
      // Linha justificada: distribui o espaço residual com balanceamento perfeito
      const extraSpace = maxWidth - sumWordsWidth;
      const spaceWidth = extraSpace / (nonSpaceWords.length - 1);

      for (let wIdx = 0; wIdx < nonSpaceWords.length; wIdx++) {
        const item = nonSpaceWords[wIdx];
        doc.setFont('times', item.bold ? 'bold' : 'normal');
        doc.text(item.word.replace(/\u00A0/g, ' '), cursorX, currentY);
        cursorX += item.width + (wIdx < nonSpaceWords.length - 1 ? spaceWidth : 0);
      }
    }

    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Cria o documento PDF com LAYOUT 100% EXATO ao arquivo RECIBO SIMPLES.docm:
 * - Dimensões: A4 (210 x 297 mm)
 * - Margem Superior: 3,0 cm (30 mm)
 * - Margem Esquerda: 3,0 cm (30 mm)
 * - Margem Direita: 2,0 cm (20 mm) -> Largura útil = 160 mm
 * - Margem Inferior: 2,0 cm (20 mm)
 * - Tipografia: Times New Roman, 12 pt (Título 14 pt bold)
 * - Sem nenhuma borda, moldura ou cor adicionada
 */
export function renderizarPaginaRecibo(
  doc: jsPDF,
  pagamento: PaymentRecord,
  contrato: ContractConfig
): void {
  doc.setTextColor(0, 0, 0);

  const margemEsq = 30; // 3,0 cm
  const margemDir = 20; // 2,0 cm
  const larguraUtil = 210 - margemEsq - margemDir; // 160 mm
  const bordaDir = 210 - margemDir; // 190 mm
  const centroX = margemEsq + larguraUtil / 2; // 110 mm

  let cursorY = 30; // Margem superior 3,0 cm

  const lineHeight = 6.35; // Altura da linha para fonte 12pt com espaçamento 1,5 (18pt = 6,35mm)

  // 1. Recibo de Pagamento (fonte 14, negrito, centralizado)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('Recibo de Pagamento', centroX, cursorY, { align: 'center' });

  // 1 enter
  cursorY += lineHeight;

  // 2. 1ª VIA (fonte 12, negrito, alinhado à direita)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('1ª VIA', bordaDir, cursorY, { align: 'right' });

  // 2 enter
  cursorY += lineHeight * 2;

  // Dados formatados
  const valorFormatado = formatarNumeroMoeda(pagamento.valor);
  const saldoFormatado = formatarNumeroMoeda(pagamento.saldo);
  const valorExtenso = valorPorExtenso(pagamento.valor);
  const saldoExtenso = valorPorExtenso(pagamento.saldo);

  // Formata data DD/MM/AAAA para o texto
  let diaStr = pagamento.dia.padStart(2, '0');
  let mesStr = '';
  let anoStr = pagamento.ano;
  if (pagamento.data && pagamento.data.includes('-')) {
    const parts = pagamento.data.split('-');
    anoStr = parts[0];
    mesStr = parts[1];
    diaStr = parts[2];
  } else {
    const mesIndex = MESES_PT_BR.indexOf(pagamento.mes.toLowerCase());
    mesStr = (mesIndex >= 0 ? mesIndex + 1 : 1).toString().padStart(2, '0');
  }
  const dataPtBr = `${diaStr}/${mesStr}/${anoStr}`;

  // 3. Eu, ... (fonte 12, justificado, espaçamento 1,5)
  const tituloContratoLimpo = (contrato.tituloContrato || 'Contrato de Promessa de Cessão de Direitos Hereditários')
    .replace(/,?\s*firmado\s+em.*$/i, '')
    .replace(/\.$/, '')
    .trim();

  const tokensP1: TextToken[] = [
    { text: 'Eu, ', bold: false },
    { text: pagamento.nome, bold: true },
    { text: ', inscrito(a) no CPF\u00A0nº ', bold: false },
    { text: pagamento.cpf, bold: true },
    { text: ', declaro que recebi de ', bold: false },
    { text: contrato.pagadorNome, bold: true },
    { text: ', CPF\u00A0nº ', bold: false },
    { text: contrato.pagadorCpf, bold: true },
    { text: ', a quantia de ', bold: false },
    { text: `R$\u00A0${valorFormatado} (${valorExtenso})`, bold: true },
    { text: ', no dia ', bold: false },
    { text: dataPtBr, bold: true },
    { text: ', referente à ', bold: false },
    {
      text: `parcela\u00A0nº\u00A0${pagamento.parcela} do ${tituloContratoLimpo}`,
      bold: true,
    },
    { text: ', firmado em ', bold: false },
    { text: '19\u00A0de\u00A0agosto\u00A0de\u00A02025', bold: true },
    { text: '.', bold: false },
  ];

  cursorY = renderizarParagrafoJustificado(
    doc,
    tokensP1,
    margemEsq,
    cursorY,
    larguraUtil,
    lineHeight,
    12
  );

  // 1 enter
  cursorY += lineHeight;

  // 4. Pagamento recebido... (fonte 12, justificado, espaçamento 1,5)
  const transferInfo = extrairDadosTransferencia(pagamento, contrato);
  const isEspecie =
    pagamento.formaPgto?.toUpperCase().includes('ESPÉCIE') ||
    pagamento.formaPgto?.toUpperCase().includes('ESPECIE');

  const bancoNomePuroPix = extrairNomePuroBanco(pagamento.banco);

  let tokensP2: TextToken[] = [
    { text: 'Pagamento recebido através da ', bold: false },
    {
      text: `chave\u00A0Pix\u00A0nº\u00A0${pagamento.chave}${bancoNomePuroPix ? `, ${bancoNomePuroPix}` : ''}`,
      bold: true,
    },
    { text: '.', bold: false },
  ];

  if (transferInfo.isTransfer) {
    tokensP2 = [
      { text: 'Pagamento recebido através de ', bold: false },
      { text: transferInfo.descricaoTipo, bold: true },
      { text: ', creditado no banco ', bold: false },
      { text: transferInfo.bancoNomePuro, bold: true },
    ];
    if (transferInfo.agencia && transferInfo.conta) {
      tokensP2.push({
        text: `, Agência número ${transferInfo.agencia} e Conta ${transferInfo.tipoContaFormatada} de número ${transferInfo.conta}.`,
        bold: false,
      });
    } else if (transferInfo.agencia) {
      tokensP2.push({
        text: `, Agência número ${transferInfo.agencia}.`,
        bold: false,
      });
    } else if (transferInfo.conta) {
      tokensP2.push({
        text: `, Conta ${transferInfo.tipoContaFormatada} de número ${transferInfo.conta}.`,
        bold: false,
      });
    } else {
      tokensP2.push({ text: '.', bold: false });
    }
  } else if (isEspecie) {
    tokensP2 = [
      { text: 'Pagamento recebido ', bold: false },
      {
        text: 'em espécie (moeda corrente nacional)',
        bold: true,
      },
      { text: '.', bold: false },
    ];
  }

  cursorY = renderizarParagrafoJustificado(
    doc,
    tokensP2,
    margemEsq,
    cursorY,
    larguraUtil,
    lineHeight,
    12
  );

  // 1 enter
  cursorY += lineHeight;

  // 5. Após ... (fonte 12, justificado, espaçamento 1,5)
  const tokensP3: TextToken[] = [
    {
      text: 'Após este pagamento, o saldo devedor atualizado referente à minha parte é de ',
      bold: false,
    },
    {
      text: `R$\u00A0${saldoFormatado} (${saldoExtenso})`,
      bold: true,
    },
    { text: '.', bold: false },
  ];

  cursorY = renderizarParagrafoJustificado(
    doc,
    tokensP3,
    margemEsq,
    cursorY,
    larguraUtil,
    lineHeight,
    12
  );

  // 1 enter
  cursorY += lineHeight;

  // 6. Para maior ... (fonte 12, justificado, espaçamento 1,5)
  const tokensP4: TextToken[] = [
    {
      text: 'Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo ',
      bold: false,
    },
    { text: 'quitação plena, geral e irrevogável', bold: true },
    { text: ' pela quantia recebida.', bold: false },
  ];

  cursorY = renderizarParagrafoJustificado(
    doc,
    tokensP4,
    margemEsq,
    cursorY,
    larguraUtil,
    lineHeight,
    12
  );

  // 4 enter
  cursorY += lineHeight * 4;

  // 7. Local, data ... (fonte 12, negrito, alinhado à direita)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const dataExtensoLinha = `${pagamento.cidadeUf}, ${pagamento.dia} de ${pagamento.mes} de ${pagamento.ano}`;
  doc.text(dataExtensoLinha, bordaDir, cursorY, { align: 'right' });

  // 7 enter
  cursorY += lineHeight * 7;

  // Linha de assinatura no 8 enter (textwidth de 1 - 100% da margem útil: 160mm)
  cursorY += lineHeight;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2); // 0.5 pt
  doc.line(margemEsq, cursorY, bordaDir, cursorY);

  cursorY += 4.5;

  // 8. nome (fonte 12, negrito, centralizado)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(pagamento.nome, centroX, cursorY, { align: 'center' });

  // cpf (fonte 12, centralizado, próxima linha 1,5)
  cursorY += lineHeight;
  doc.setFont('times', 'normal');
  const cpfPrefix = 'CPF: ';
  const cpfVal = pagamento.cpf;
  const wPrefix = doc.getTextWidth(cpfPrefix);
  doc.setFont('times', 'bold');
  const wCpf = doc.getTextWidth(cpfVal);
  const startCpfX = centroX - (wPrefix + wCpf) / 2;

  doc.setFont('times', 'normal');
  doc.text(cpfPrefix, startCpfX, cursorY);
  doc.setFont('times', 'bold');
  doc.text(cpfVal, startCpfX + wPrefix, cursorY);
}

export function criarDocumentoPdfRecibo(
  pagamento: PaymentRecord,
  contrato: ContractConfig
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  renderizarPaginaRecibo(doc, pagamento, contrato);
  return doc;
}

export function criarDocumentoPdfRecibosMultiplos(
  pagamentos: PaymentRecord[],
  contrato: ContractConfig
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pagamentos.forEach((pagamento, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderizarPaginaRecibo(doc, pagamento, contrato);
  });

  return doc;
}

export function baixarPdfRecibosConsolidados(
  pagamentos: PaymentRecord[],
  contrato: ContractConfig,
  nomeArquivo: string = 'RECIBOS_CONSOLIDADOS.pdf'
): void {
  const doc = criarDocumentoPdfRecibosMultiplos(pagamentos, contrato);
  doc.save(nomeArquivo);
}

export async function baixarPdfRecibo(
  pagamento: PaymentRecord,
  contrato: ContractConfig
): Promise<void> {
  const nomeArquivo = gerarNomeArquivoRecibo(pagamento);

  // Tenta baixar o PDF oficial gerado nativamente pelo QuestPDF em memória C#
  try {
    const res = await fetch(`/api/recibos/${pagamento.id}/pdf`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // Fallback automático para o gerador client-side jsPDF
  }

  const doc = criarDocumentoPdfRecibo(pagamento, contrato);
  doc.save(nomeArquivo);
}

/**
 * Gera um arquivo ZIP contendo cada recibo em PDF individual.
 */
export async function baixarPdfRecibosZip(
  pagamentos: PaymentRecord[],
  contrato: ContractConfig,
  nomeZip: string = 'RECIBOS_INDIVIDUAIS.zip'
): Promise<void> {
  const pagos = pagamentos.filter((p) => (p.status?.toString().toUpperCase() || 'PAGO') === 'PAGO');
  if (pagos.length === 0) return;

  const nomeFinalZip = nomeZip.endsWith('.zip') ? nomeZip : `${nomeZip}.zip`;

  // Tenta gerar pacote ZIP em lote no backend via QuestPDF
  try {
    const res = await fetch('/api/recibos/lote-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIds: pagos.map((p) => p.id) }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeFinalZip;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // Fallback automático para JSZip no navegador
  }

  const zip = new JSZip();
  const nomesUsados = new Map<string, number>();

  for (const pagamento of pagos) {
    const doc = criarDocumentoPdfRecibo(pagamento, contrato);
    const pdfBlob = doc.output('blob');
    let nomeArquivo = gerarNomeArquivoRecibo(pagamento);
    if (!nomeArquivo.toLowerCase().endsWith('.pdf')) {
      nomeArquivo += '.pdf';
    }

    const count = nomesUsados.get(nomeArquivo) || 0;
    let nomeFinal = nomeArquivo;
    if (count > 0) {
      nomeFinal = nomeArquivo.replace(/\.pdf$/i, `_${count + 1}.pdf`);
    }
    nomesUsados.set(nomeArquivo, count + 1);

    zip.file(nomeFinal, pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeFinalZip;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Emite recibos em PDF individual conforme regra estrita:
 * - 1 selecionado: baixa o PDF individual diretamente.
 * - Múltiplos selecionados: gera um ZIP contendo todos os PDFs individuais.
 */
export async function emitirRecibos(
  pagamentos: PaymentRecord[],
  contrato: ContractConfig,
  nomeLote?: string
): Promise<void> {
  const pagos = pagamentos.filter((p) => (p.status?.toString().toUpperCase() || 'PAGO') === 'PAGO');
  if (pagos.length === 0) return;

  if (pagos.length === 1) {
    baixarPdfRecibo(pagos[0], contrato);
  } else {
    const nomeZip = nomeLote || `RECIBOS_LOTE_${pagos.length}_ARQUIVOS.zip`;
    await baixarPdfRecibosZip(pagos, contrato, nomeZip);
  }
}

export function imprimirRecibo(
  pagamento: PaymentRecord,
  contrato: ContractConfig
): void {
  const doc = criarDocumentoPdfRecibo(pagamento, contrato);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.focus();
  }
}

export function imprimirRecibosMultiplos(
  pagamentos: PaymentRecord[],
  contrato: ContractConfig
): void {
  const doc = criarDocumentoPdfRecibosMultiplos(pagamentos, contrato);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.focus();
  }
}
