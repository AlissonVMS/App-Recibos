using System.IO.Compression;
using System.Text.RegularExpressions;
using AppRecibos.Core.Domain.Common;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AppRecibos.Core.Services;

public record ReciboDados(
    Pagamento Pagamento,
    Beneficiario Beneficiario,
    ContratoConfig Contrato
);

public class QuestPdfReceiptGenerator
{
    static QuestPdfReceiptGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.UseSystemFonts = true;
        QuestPDF.Settings.ThrowOnMissingFontFamilies = false;
    }

    public static string ExtrairNomePuroBanco(string? banco)
    {
        if (string.IsNullOrWhiteSpace(banco)) return string.Empty;
        var limpo = banco.Trim();

        // Remove prefixo de código ex: "260 - ", "001 - "
        limpo = Regex.Replace(limpo, @"^\d+\s*[-–—]\s*", "");

        // Remove sufixos entre parênteses ex: "(Nubank)", "(Caixa)"
        limpo = Regex.Replace(limpo, @"\s*\([^)]*\)", "");

        return limpo.Trim();
    }

    public static string SanitizarNomeArquivo(string nome)
    {
        var invalidos = Path.GetInvalidFileNameChars();
        var limpo = new string(nome.Where(c => !invalidos.Contains(c)).ToArray());
        return Regex.Replace(limpo, @"\s+", " ").Trim();
    }

    public static string GerarNomeArquivoRecibo(Pagamento pag, int sufixo = 0)
    {
        var nomeUpper = Regex.Replace(pag.BeneficiarioNome?.Trim() ?? string.Empty, @"\s+", " ").ToUpperInvariant();
        var numParcela = Regex.Replace(pag.ParcelaNumero.ToString(), @"\D+", "");
        if (string.IsNullOrWhiteSpace(numParcela)) numParcela = pag.ParcelaNumero.ToString();
        var parcelaUpper = $"P{numParcela}";

        long inteiro = (long)Math.Truncate(Math.Abs(pag.Valor));
        int centavos = (int)Math.Round((Math.Abs(pag.Valor) - inteiro) * 100);
        var valorFormatado = $"R${inteiro},{centavos:D2}";

        string dia = "";
        string mesNum = "";
        string ano = "";

        var rawDate = (!string.IsNullOrWhiteSpace(pag.DataPagamento) ? pag.DataPagamento
                    : !string.IsNullOrWhiteSpace(pag.DataPrevista) ? pag.DataPrevista
                    : pag.Data ?? string.Empty).Trim();

        if (rawDate.Contains('-'))
        {
            var parts = rawDate.Split('-');
            if (parts.Length == 3)
            {
                if (parts[0].Length == 4)
                {
                    ano = parts[0];
                    mesNum = parts[1];
                    dia = parts[2];
                }
                else
                {
                    dia = parts[0];
                    mesNum = parts[1];
                    ano = parts[2];
                }
            }
        }
        else if (rawDate.Contains('/'))
        {
            var parts = rawDate.Split('/');
            if (parts.Length == 3)
            {
                if (parts[0].Length == 4)
                {
                    ano = parts[0];
                    mesNum = parts[1];
                    dia = parts[2];
                }
                else
                {
                    dia = parts[0];
                    mesNum = parts[1];
                    ano = parts[2];
                }
            }
        }

        if (string.IsNullOrWhiteSpace(dia) && !string.IsNullOrWhiteSpace(pag.Dia)) dia = pag.Dia.Trim();
        if (string.IsNullOrWhiteSpace(ano) && !string.IsNullOrWhiteSpace(pag.Ano)) ano = pag.Ano.Trim();

        if (string.IsNullOrWhiteSpace(mesNum) && !string.IsNullOrWhiteSpace(pag.Mes))
        {
            var mesStr = pag.Mes.Trim();
            if (int.TryParse(mesStr, out var mNum) && mNum >= 1 && mNum <= 12)
            {
                mesNum = mNum.ToString("D2");
            }
            else
            {
                var idx = Array.FindIndex(NumberToWordsPtBr.MesesPtBr, m => m.Equals(mesStr, StringComparison.OrdinalIgnoreCase));
                mesNum = (idx >= 0 ? idx + 1 : 1).ToString("D2");
            }
        }

        dia = (string.IsNullOrWhiteSpace(dia) ? "01" : dia).PadLeft(2, '0');
        mesNum = (string.IsNullOrWhiteSpace(mesNum) ? "01" : mesNum).PadLeft(2, '0');
        ano = string.IsNullOrWhiteSpace(ano) ? DateTime.Now.Year.ToString() : ano;

        var dataFormatada = $"{dia}-{mesNum}-{ano}";
        var baseNome = $"RECIBO {nomeUpper} {parcelaUpper} {valorFormatado} {dataFormatada}".ToUpperInvariant();
        var limpo = SanitizarNomeArquivo(baseNome);
        return sufixo > 0 ? $"{limpo} ({sufixo}).pdf" : $"{limpo}.pdf";
    }

    public byte[] GerarReciboPdf(ReciboDados dados)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(30, Unit.Millimetre);
                page.MarginLeft(30, Unit.Millimetre);
                page.MarginRight(20, Unit.Millimetre);
                page.MarginBottom(20, Unit.Millimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontFamily("Times New Roman").FontSize(12).FontColor(Colors.Black).LineHeight(1.5f));

                page.Content().Column(col =>
                {
                    // Título: Recibo de Pagamento (fonte 14, negrito, centralizado)
                    col.Item().AlignCenter().Text("Recibo de Pagamento").Bold().FontSize(14);

                    // 1 enter (espaçamento)
                    col.Item().PaddingTop(18);

                    // 1ª VIA (fonte 12, negrito, alinhado à direita)
                    col.Item().AlignRight().Text("1ª VIA").Bold().FontSize(12);

                    // 2 enters
                    col.Item().PaddingTop(36);

                    // Parágrafo 1: Eu, [Nome], inscrito(a) no CPF...
                    var valorFormatado = NumberToWordsPtBr.FormatarNumeroMoeda(dados.Pagamento.Valor);
                    var valorExtenso = NumberToWordsPtBr.ValorPorExtenso(dados.Pagamento.Valor);
                    var dataPtBr = NumberToWordsPtBr.FormatarDataPtBr(dados.Pagamento.DataPagamento ?? dados.Pagamento.DataPrevista);

                    var tituloContratoLimpo = Regex.Replace(dados.Contrato.TituloContrato ?? "Contrato de Promessa de Cessão de Direitos Hereditários", @",?\s*firmado\s+em.*$", "", RegexOptions.IgnoreCase).Trim();
                    tituloContratoLimpo = tituloContratoLimpo.TrimEnd('.');

                    var dataContratoFormatada = dados.Contrato.DataContrato ?? "19 de agosto de 2025";

                    col.Item().Text(text =>
                    {
                        text.Justify();
                        text.Span("Eu, ");
                        text.Span(dados.Pagamento.BeneficiarioNome).Bold();
                        text.Span(", inscrito(a) no CPF nº ");
                        text.Span(dados.Pagamento.BeneficiarioCpf).Bold();
                        text.Span(", declaro que recebi de ");
                        text.Span(dados.Contrato.PagadorNome).Bold();
                        text.Span(", CPF nº ");
                        text.Span(dados.Contrato.PagadorCpf).Bold();
                        text.Span(", a quantia de ");
                        text.Span($"R$ {valorFormatado} ({valorExtenso})").Bold();
                        text.Span(", no dia ");
                        text.Span(dataPtBr).Bold();
                        text.Span(", referente à ");
                        text.Span($"parcela nº {dados.Pagamento.ParcelaNumero} do {tituloContratoLimpo}").Bold();
                        text.Span(", firmado em ");
                        text.Span(dataContratoFormatada).Bold();
                        text.Span(".");
                    });

                    // 1 enter
                    col.Item().PaddingTop(18);

                    // Parágrafo 2: Forma de pagamento
                    var bancoNomePuro = ExtrairNomePuroBanco(dados.Pagamento.Banco);
                    var formaPgto = (dados.Pagamento.FormaPgto ?? "PIX").Trim().ToUpperInvariant();
                    var isEspecie = formaPgto.Contains("ESPÉCIE") || formaPgto.Contains("ESPECIE");
                    var isTransfer = formaPgto.Contains("TRANSF") || formaPgto.Contains("TED") || formaPgto.Contains("DOC");

                    col.Item().Text(text =>
                    {
                        text.Justify();

                        if (isEspecie)
                        {
                            text.Span("Pagamento recebido ");
                            text.Span("em espécie (moeda corrente nacional)").Bold();
                            text.Span(".");
                        }
                        else if (isTransfer)
                        {
                            text.Span("Pagamento recebido através de transferência bancária, creditado no banco ");
                            text.Span(bancoNomePuro).Bold();
                            if (!string.IsNullOrWhiteSpace(dados.Beneficiario.Agencia) && !string.IsNullOrWhiteSpace(dados.Beneficiario.Conta))
                            {
                                text.Span($", Agência nº {dados.Beneficiario.Agencia} e Conta {dados.Beneficiario.TipoConta} nº {dados.Beneficiario.Conta}");
                            }
                            text.Span(".");
                        }
                        else
                        {
                            // PIX Padrão Oficial: "Pagamento recebido através da chave Pix nº {chave}, {banco}."
                            text.Span("Pagamento recebido através da ");
                            var bancoTrecho = !string.IsNullOrWhiteSpace(bancoNomePuro) ? $", {bancoNomePuro}" : "";
                            text.Span($"chave Pix nº {dados.Pagamento.ChavePix}{bancoTrecho}").Bold();
                            text.Span(".");
                        }
                    });

                    // 1 enter
                    col.Item().PaddingTop(18);

                    // Parágrafo 3: Saldo devedor atualizado
                    var saldoFormatado = NumberToWordsPtBr.FormatarNumeroMoeda(dados.Pagamento.SaldoAposParcela);
                    var saldoExtenso = NumberToWordsPtBr.ValorPorExtenso(dados.Pagamento.SaldoAposParcela);

                    col.Item().Text(text =>
                    {
                        text.Justify();
                        text.Span("Após este pagamento, o saldo devedor atualizado referente à minha parte é de ");
                        text.Span($"R$ {saldoFormatado} ({saldoExtenso})").Bold();
                        text.Span(".");
                    });

                    // 1 enter
                    col.Item().PaddingTop(18);

                    // Parágrafo 4: Quitação
                    col.Item().Text(text =>
                    {
                        text.Justify();
                        text.Span("Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo ");
                        text.Span("quitação plena, geral e irrevogável").Bold();
                        text.Span(" pela quantia recebida.");
                    });

                    // 4 enters
                    col.Item().PaddingTop(60);

                    // Local e data
                    var cidadeUf = string.IsNullOrWhiteSpace(dados.Pagamento.CidadeUf) ? "Maceió - AL" : dados.Pagamento.CidadeUf;
                    var dia = dados.Pagamento.Dia ?? "11";
                    var mes = dados.Pagamento.Mes ?? "maio";
                    var ano = dados.Pagamento.Ano ?? "2026";

                    col.Item().AlignRight().Text($"{cidadeUf}, {dia} de {mes} de {ano}").Bold().FontSize(12);

                    // 7 enters
                    col.Item().PaddingTop(90);

                    // Linha de assinatura
                    col.Item().LineHorizontal(1).LineColor(Colors.Black);
                    col.Item().PaddingTop(4);

                    // Nome do beneficiário (negrito, centralizado)
                    col.Item().AlignCenter().Text(dados.Pagamento.BeneficiarioNome).Bold().FontSize(12);

                    // CPF do beneficiário (centralizado)
                    col.Item().AlignCenter().Text(text =>
                    {
                        text.Span("CPF: ");
                        text.Span(dados.Pagamento.BeneficiarioCpf).Bold();
                    });
                });
            });
        });

        return doc.GeneratePdf();
    }

    public byte[] GerarLoteZip(IEnumerable<ReciboDados> itens)
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            foreach (var item in itens)
            {
                var pdfBytes = GerarReciboPdf(item);
                var fileName = GerarNomeArquivoRecibo(item.Pagamento);

                var entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
                using var entryStream = entry.Open();
                entryStream.Write(pdfBytes, 0, pdfBytes.Length);
            }
        }

        return memoryStream.ToArray();
    }
}
