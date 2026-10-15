using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AppRecibos.Native.ViewModels;

public sealed class ReceiptDisplayItem
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    public Pagamento Pagamento { get; }
    public Beneficiario Beneficiario { get; }
    public ContratoConfig Contrato { get; }

    public string BeneficiarioNome => Beneficiario.Nome;
    public string BeneficiarioCpf => Beneficiario.Cpf;
    public int ParcelaNumero => Pagamento.ParcelaNumero;
    public string ValorFormatado => Pagamento.Valor.ToString("C", PtBr);
    public string ValorExtenso => NumberToWordsPtBr.ValorPorExtenso(Pagamento.Valor);
    public string SaldoFormatado => Pagamento.SaldoAposParcela.ToString("C", PtBr);
    public string SaldoExtenso => NumberToWordsPtBr.ValorPorExtenso(Pagamento.SaldoAposParcela);

    public string DataPtBr { get; }
    public string TituloContratoLimpo { get; }
    public string FormaPagamentoDescricao { get; }
    public string LocalDataExtenso { get; }

    public ReceiptDisplayItem(Pagamento pag, Beneficiario ben, ContratoConfig contrato)
    {
        Pagamento = pag;
        Beneficiario = ben;
        Contrato = contrato;

        // Limpa título do contrato
        var titulo = contrato.TituloContrato ?? "Contrato de Promessa de Cessão de Direitos Hereditários";
        TituloContratoLimpo = Regex.Replace(titulo, @",?\s*firmado\s+em.*$", "", RegexOptions.IgnoreCase).Trim().TrimEnd('.');

        // Formata data DD/MM/AAAA
        var dia = pag.Dia ?? "01";
        var mes = pag.Mes ?? "01";
        var ano = pag.Ano ?? DateTime.Now.Year.ToString();

        var rawDate = (!string.IsNullOrWhiteSpace(pag.DataPagamento) ? pag.DataPagamento
                    : !string.IsNullOrWhiteSpace(pag.DataPrevista) ? pag.DataPrevista
                    : pag.Data ?? string.Empty).Trim();

        if (rawDate.Contains('-'))
        {
            var parts = rawDate.Split('-');
            if (parts.Length == 3)
            {
                if (parts[0].Length == 4) { ano = parts[0]; mes = parts[1]; dia = parts[2]; }
                else { dia = parts[0]; mes = parts[1]; ano = parts[2]; }
            }
        }

        if (int.TryParse(mes, out var mNum) && mNum >= 1 && mNum <= 12)
        {
            mes = NumberToWordsPtBr.MesesPtBr[mNum - 1];
        }

        var mesIndex = Array.FindIndex(NumberToWordsPtBr.MesesPtBr, m => m.Equals(mes, StringComparison.OrdinalIgnoreCase));
        var mesNumStr = (mesIndex >= 0 ? mesIndex + 1 : 1).ToString("D2");
        DataPtBr = $"{dia.PadLeft(2, '0')}/{mesNumStr}/{ano}";

        var cidadeUf = !string.IsNullOrWhiteSpace(pag.CidadeUf) ? pag.CidadeUf
                     : !string.IsNullOrWhiteSpace(ben.CidadeUf) ? ben.CidadeUf
                     : "Maceió - AL";

        LocalDataExtenso = $"{cidadeUf}, {dia} de {mes} de {ano}";

        // Descrição do pagamento (Pix / Espécie / Transferência)
        var bancoPuro = QuestPdfReceiptGenerator.ExtrairNomePuroBanco(pag.Banco ?? ben.Banco);
        var chave = !string.IsNullOrWhiteSpace(pag.ChavePix) ? pag.ChavePix : ben.ChavePix;
        var forma = pag.FormaPgto ?? "PIX";

        if (forma.Contains("Espécie", StringComparison.OrdinalIgnoreCase) || forma.Contains("Especie", StringComparison.OrdinalIgnoreCase))
        {
            FormaPagamentoDescricao = "Pagamento recebido em espécie (moeda corrente nacional).";
        }
        else
        {
            var bancoSuffix = !string.IsNullOrWhiteSpace(bancoPuro) ? $", {bancoPuro}" : string.Empty;
            FormaPagamentoDescricao = $"Pagamento recebido através da chave Pix nº {chave}{bancoSuffix}.";
        }
    }
}

public partial class ReceiptPreviewDialogViewModel : ViewModelBase
{
    private readonly ContratoConfig _contrato;
    private readonly QuestPdfReceiptGenerator _generator = new();

    public Func<string, string, string, string, Task<string?>>? RequestSaveFileDialog { get; set; }
    public Action<string>? OpenFilePath { get; set; }

    [ObservableProperty]
    private ObservableCollection<ReceiptDisplayItem> _receiptItems = new();

    [ObservableProperty]
    private int _currentIndex = 0;

    [ObservableProperty]
    private ReceiptDisplayItem? _currentReceipt;

    [ObservableProperty]
    private bool _hasMultipleReceipts;

    [ObservableProperty]
    private int _totalReceiptsCount;

    [ObservableProperty]
    private string _pageIndicator = "Recibo 1 de 1";

    [ObservableProperty]
    private bool _canGoPrev;

    [ObservableProperty]
    private bool _canGoNext;

    [ObservableProperty]
    private bool _isGenerating;

    public event Action? RequestClose;

    public ReceiptPreviewDialogViewModel(
        IReadOnlyList<Pagamento> pagamentos,
        IReadOnlyList<Beneficiario> beneficiarios,
        ContratoConfig contrato)
    {
        _contrato = contrato;

        var items = new List<ReceiptDisplayItem>();
        foreach (var pag in pagamentos)
        {
            var ben = beneficiarios.FirstOrDefault(b => b.Id == pag.BeneficiarioId || b.Nome == pag.BeneficiarioNome)
                   ?? new Beneficiario
                   {
                       Id = pag.BeneficiarioId,
                       Nome = pag.BeneficiarioNome ?? "Beneficiário",
                       Cpf = pag.BeneficiarioCpf ?? "",
                       CidadeUf = pag.CidadeUf ?? "Maceió - AL",
                       Banco = pag.Banco ?? "",
                       ChavePix = pag.ChavePix ?? "",
                       Status = "EM ABERTO",
                       TipoConta = "CORRENTE"
                   };

            items.Add(new ReceiptDisplayItem(pag, ben, contrato));
        }

        ReceiptItems = new ObservableCollection<ReceiptDisplayItem>(items);
        TotalReceiptsCount = items.Count;
        HasMultipleReceipts = TotalReceiptsCount > 1;

        if (TotalReceiptsCount > 0)
        {
            CurrentIndex = 0;
            CurrentReceipt = ReceiptItems[0];
        }

        UpdateNavigation();
    }

    partial void OnCurrentIndexChanged(int value)
    {
        if (value >= 0 && value < ReceiptItems.Count)
        {
            CurrentReceipt = ReceiptItems[value];
        }
        UpdateNavigation();
    }

    private void UpdateNavigation()
    {
        CanGoPrev = CurrentIndex > 0;
        CanGoNext = CurrentIndex < TotalReceiptsCount - 1;
        PageIndicator = TotalReceiptsCount > 0 ? $"Recibo {CurrentIndex + 1} de {TotalReceiptsCount}" : "0 Recibos";
    }

    [RelayCommand]
    private void Next()
    {
        if (CanGoNext) CurrentIndex++;
    }

    [RelayCommand]
    private void Prev()
    {
        if (CanGoPrev) CurrentIndex--;
    }

    [RelayCommand]
    private void SelectReceipt(ReceiptDisplayItem item)
    {
        var idx = ReceiptItems.IndexOf(item);
        if (idx >= 0) CurrentIndex = idx;
    }

    [RelayCommand]
    private void Close()
    {
        RequestClose?.Invoke();
    }

    [RelayCommand]
    private async Task PrintAllAsync()
    {
        if (CurrentReceipt == null) return;
        try
        {
            IsGenerating = true;
            var tempPdf = Path.Combine(Path.GetTempPath(), $"recibo_temp_{Guid.NewGuid():N}.pdf");
            var dados = new ReciboDados(CurrentReceipt.Pagamento, CurrentReceipt.Beneficiario, _contrato);
            var bytes = _generator.GerarReciboPdf(dados);
            await File.WriteAllBytesAsync(tempPdf, bytes);

            if (OpenFilePath != null)
            {
                OpenFilePath(tempPdf);
            }
            else
            {
                Process.Start(new ProcessStartInfo(tempPdf) { UseShellExecute = true });
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao imprimir: {ex.Message}");
        }
        finally
        {
            IsGenerating = false;
        }
    }

    [RelayCommand]
    private async Task DownloadAllAsync()
    {
        if (ReceiptItems.Count == 0) return;
        IsGenerating = true;

        try
        {
            if (ReceiptItems.Count == 1 && CurrentReceipt != null)
            {
                var defaultFileName = QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(CurrentReceipt.Pagamento);
                string? targetPath = null;
                if (RequestSaveFileDialog != null)
                {
                    targetPath = await RequestSaveFileDialog("Salvar Recibo em PDF", defaultFileName, "pdf", "Documento PDF (*.pdf)");
                }
                else
                {
                    targetPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", defaultFileName);
                }

                if (!string.IsNullOrWhiteSpace(targetPath))
                {
                    var dados = new ReciboDados(CurrentReceipt.Pagamento, CurrentReceipt.Beneficiario, _contrato);
                    var bytes = _generator.GerarReciboPdf(dados);
                    await File.WriteAllBytesAsync(targetPath, bytes);
                    RequestClose?.Invoke();
                }
            }
            else
            {
                var defaultFileName = $"RECIBOS_LOTE_{DateTime.Now:yyyyMMdd_HHmm}.zip";
                string? targetPath = null;
                if (RequestSaveFileDialog != null)
                {
                    targetPath = await RequestSaveFileDialog("Salvar Lote de Recibos em ZIP", defaultFileName, "zip", "Arquivo Compactado ZIP (*.zip)");
                }
                else
                {
                    targetPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", defaultFileName);
                }

                if (!string.IsNullOrWhiteSpace(targetPath))
                {
                    using var ms = new MemoryStream();
                    using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
                    {
                        var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                        foreach (var item in ReceiptItems)
                        {
                            var baseName = QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(item.Pagamento);
                            var name = baseName;
                            int counter = 2;
                            while (usedNames.Contains(name))
                            {
                                name = QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(item.Pagamento, counter++);
                            }
                            usedNames.Add(name);

                            var dados = new ReciboDados(item.Pagamento, item.Beneficiario, _contrato);
                            var pdfBytes = _generator.GerarReciboPdf(dados);

                            var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
                            using var entryStream = entry.Open();
                            await entryStream.WriteAsync(pdfBytes);
                        }
                    }

                    await File.WriteAllBytesAsync(targetPath, ms.ToArray());
                    RequestClose?.Invoke();
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao baixar recibos: {ex.Message}");
        }
        finally
        {
            IsGenerating = false;
        }
    }
}
