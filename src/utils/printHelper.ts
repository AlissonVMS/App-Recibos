import { ContractConfig, PaymentRecord } from '../types';
import {
  formatarNumeroMoeda,
  MESES_PT_BR,
  valorPorExtenso,
} from './numberToWordsPtBr';
import { extrairDadosTransferencia } from './transferHelper';
import { formatarBancoCompe } from '../data/bacenBanks';

/**
 * Imprime o recibo oficial de forma confiável e direta através de iframe isolado,
 * garantindo tipografia perfeita, isolamento de DOM e diálogo de impressão A4 imediato.
 */
export function imprimirElementoRecibo(elementId: string = 'receipt-print-area'): void {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Recibo Oficial de Pagamento</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: white !important;
              color: black !important;
              font-family: "Times New Roman", Times, Georgia, serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
            .print-wrapper {
              width: 210mm;
              min-height: 297mm;
              padding-top: 30mm;
              padding-left: 30mm;
              padding-right: 20mm;
              padding-bottom: 20mm;
              margin: 0 auto;
              background: white;
              color: black;
              line-height: 1.5;
            }
            p {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 30000);
      }
    }, 250);
  } catch (err) {
    console.error('Erro ao acionar janela de impressão:', err);
    window.print();
  }
}

/**
 * Gera o HTML de uma página A4 de recibo oficial para impressão
 */
function gerarHtmlPaginaRecibo(pagamento: PaymentRecord, contrato: ContractConfig): string {
  const valorFormatado = formatarNumeroMoeda(pagamento.valor);
  const saldoFormatado = formatarNumeroMoeda(pagamento.saldo);
  const valorExtenso = valorPorExtenso(pagamento.valor);
  const saldoExtenso = valorPorExtenso(pagamento.saldo);

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

  const transferInfo = extrairDadosTransferencia(pagamento, contrato);
  const isEspecie =
    pagamento.formaPgto?.toUpperCase().includes('ESPÉCIE') ||
    pagamento.formaPgto?.toUpperCase().includes('ESPECIE');

  let formaPgtoHtml = `Pagamento recebido através da <strong>chave&nbsp;Pix&nbsp;nº&nbsp;${pagamento.chave}, ${formatarBancoCompe(pagamento.banco)}</strong>.`;
  if (transferInfo.isTransfer) {
    formaPgtoHtml = transferInfo.textoHtml;
  } else if (isEspecie) {
    formaPgtoHtml = 'Pagamento recebido <strong>em espécie (moeda corrente nacional)</strong>.';
  }

  const tituloContratoLimpo = (contrato.tituloContrato || 'Contrato de Promessa de Cessão de Direitos Hereditários')
    .replace(/,?\s*firmado\s+em.*$/i, '')
    .replace(/\.$/, '')
    .trim();

  return `
    <div class="pagina-a4-impressao" style="page-break-after: always; break-after: page;">
      <p style="text-align: center; font-weight: bold; font-size: 14pt; line-height: 1.5; margin: 0;">
        Recibo de Pagamento
      </p>
      <div style="height: 1.5em;"></div>
      <p style="text-align: right; font-weight: bold; font-size: 12pt; line-height: 1.5; margin: 0;">
        1ª VIA
      </p>
      <div style="height: 3.0em;"></div>
      <p style="text-align: justify; text-justify: inter-word; font-size: 12pt; line-height: 1.5; margin: 0;">
        Eu, <strong>${pagamento.nome}</strong>, inscrito(a) no CPF&nbsp;nº&nbsp;<strong>${pagamento.cpf}</strong>, declaro que recebi de <strong>${contrato.pagadorNome}</strong>, CPF&nbsp;nº&nbsp;<strong>${contrato.pagadorCpf}</strong>, a quantia de&nbsp;<strong>R$&nbsp;${valorFormatado} (${valorExtenso})</strong>, no dia&nbsp;<strong>${dataPtBr}</strong>, referente à&nbsp;<strong>parcela&nbsp;nº&nbsp;${pagamento.parcela} do&nbsp;${tituloContratoLimpo}</strong>, firmado em&nbsp;<strong>19&nbsp;de&nbsp;agosto&nbsp;de&nbsp;2025</strong>.
      </p>
      <div style="height: 1.5em;"></div>
      <p style="text-align: justify; text-justify: inter-word; font-size: 12pt; line-height: 1.5; margin: 0;">
        ${formaPgtoHtml}
      </p>
      <div style="height: 1.5em;"></div>
      <p style="text-align: justify; text-justify: inter-word; font-size: 12pt; line-height: 1.5; margin: 0;">
        Após este pagamento, o saldo devedor atualizado referente à minha parte é de&nbsp;<strong>R$&nbsp;${saldoFormatado} (${saldoExtenso})</strong>.
      </p>
      <div style="height: 1.5em;"></div>
      <p style="text-align: justify; text-justify: inter-word; font-size: 12pt; line-height: 1.5; margin: 0;">
        Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo <strong>quitação plena, geral e irrevogável</strong> pela quantia recebida.
      </p>
      <div style="height: 6.0em;"></div>
      <p style="text-align: right; font-weight: bold; font-size: 12pt; line-height: 1.5; margin: 0;">
        ${pagamento.cidadeUf}, ${pagamento.dia}&nbsp;de&nbsp;${pagamento.mes}&nbsp;de&nbsp;${pagamento.ano}
      </p>
      <div style="height: 10.5em;"></div>
      <div style="width: 100%; border-top: 1px solid black; margin-bottom: 4px;"></div>
      <p style="text-align: center; font-weight: bold; font-size: 12pt; line-height: 1.5; margin: 0;">
        ${pagamento.nome}
      </p>
      <p style="text-align: center; font-size: 12pt; line-height: 1.5; margin: 0;">
        CPF: <strong>${pagamento.cpf}</strong>
      </p>
    </div>
  `;
}

/**
 * Imprime múltiplos recibos em lote, cada um em sua própria página A4,
 * sem bloqueador de popup ou restrições de iframe.
 */
export function imprimirLoteRecibos(
  pagamentos: PaymentRecord[],
  contrato: ContractConfig
): void {
  const pagos = pagamentos.filter((p) => (p.status || 'PAGO') === 'PAGO');
  if (pagos.length === 0) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const paginasHtml = pagos.map((p) => gerarHtmlPaginaRecibo(p, contrato)).join('');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Recibos de Pagamento</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: white !important;
            color: black !important;
            font-family: "Times New Roman", Times, Georgia, serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-sizing: border-box;
          }
          .pagina-a4-impressao {
            width: 210mm;
            min-height: 297mm;
            padding-top: 30mm;
            padding-left: 30mm;
            padding-right: 20mm;
            padding-bottom: 20mm;
            margin: 0 auto;
            background: white;
            color: black;
            line-height: 1.5;
          }
          p {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${paginasHtml}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 30000);
    }
  }, 300);
}
