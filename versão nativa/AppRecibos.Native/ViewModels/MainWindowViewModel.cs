using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Infrastructure.Data;
using AppRecibos.Core.Infrastructure.Data.Repositories;
using AppRecibos.Core.Infrastructure.Excel;
using AppRecibos.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AppRecibos.Native.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    private static readonly CultureInfo PtBr = new("pt-BR");
    private const string PrimaryOneDriveExcelPath = "/home/alisson/Documentos/OneDrive/Documentos/##docs herança irmãos/CONTROLE PAGAMENTOS.xlsx";

    private readonly SqliteDbConnectionFactory _connectionFactory;
    private readonly ContratoRepository _contratoRepo;
    private readonly BeneficiarioRepository _beneficiarioRepo;
    private readonly PagamentoRepository _pagamentoRepo;
    private readonly ExcelSyncEngine _excelEngine;
    private readonly SyncService _syncService;

    private List<Pagamento> _allPagamentos = new();

    [ObservableProperty]
    private ContratoConfig? _contrato;

    [ObservableProperty]
    private ObservableCollection<Beneficiario> _beneficiarios = new();

    [ObservableProperty]
    private ObservableCollection<BeneficiarioCardViewModel> _beneficiarioCards = new();

    [ObservableProperty]
    private ObservableCollection<PagamentoItemViewModel> _displayPagamentos = new();

    [ObservableProperty]
    private decimal _totalContrato = 90000m;

    [ObservableProperty]
    private decimal _totalPago = 40000m;

    [ObservableProperty]
    private decimal _totalComprometido = 50000m;

    public string TotalPagoFormatado => TotalPago.ToString("C2", PtBr);
    public string TotalComprometidoFormatado => TotalComprometido.ToString("C2", PtBr);

    [ObservableProperty]
    private string _contratoPagadorNome = "ABIGAIL PAULINO DA SILVA";

    [ObservableProperty]
    private string _contratoPagadorCpf = "450.519.504-00";

    [ObservableProperty]
    private string _contratoPagadorBanco = "104 - Caixa Econômica Federal";

    [ObservableProperty]
    private string _contratoTitulo = "Contrato de Promessa de Cessão de Direitos Hereditários";

    [ObservableProperty]
    private string _contratoData = "2025-08-19";

    [ObservableProperty]
    private ObservableCollection<ContractPartyViewModel> _contractParties = new();

    [ObservableProperty]
    private string _porcentagemPago = "44.4%";

    [ObservableProperty]
    private string _porcentagemComprometido = "55.6%";

    [ObservableProperty]
    private int _selectedTabIndex = 0;

    public bool IsTabControleGeral => SelectedTabIndex == 0;
    public bool IsTabPagamentos => SelectedTabIndex == 1;
    public bool IsTabContrato => SelectedTabIndex == 2;
    public bool IsTabExportar => SelectedTabIndex == 3;

    partial void OnSelectedTabIndexChanged(int value)
    {
        OnPropertyChanged(nameof(IsTabControleGeral));
        OnPropertyChanged(nameof(IsTabPagamentos));
        OnPropertyChanged(nameof(IsTabContrato));
        OnPropertyChanged(nameof(IsTabExportar));
    }

    [ObservableProperty]
    private string _searchQuery = string.Empty;

    [ObservableProperty]
    private string _selectedBeneficiarioFilter = "Todos";

    [ObservableProperty]
    private string _selectedStatusFilter = "Todos";

    [ObservableProperty]
    private ObservableCollection<string> _beneficiarioFilterOptions = new() { "Todos" };

    [ObservableProperty]
    private ObservableCollection<string> _statusFilterOptions = new() { "Todos", "PAGO", "PREVISTO" };

    // --- Totais e Contadores para Barra de Ferramentas ---
    [ObservableProperty]
    private int _totalCount = 0;

    [ObservableProperty]
    private int _totalPaidCount = 0;

    [ObservableProperty]
    private int _totalPrevistoCount = 0;

    [ObservableProperty]
    private int _visibleCount = 0;

    [ObservableProperty]
    private int _visiblePaidCount = 0;

    [ObservableProperty]
    private int _visiblePrevistoCount = 0;

    // --- Métricas de Seleção Ativa ---
    public int SelectedCount => DisplayPagamentos.Count(p => p.IsSelected);
    public int SelectedPaidCount => DisplayPagamentos.Count(p => p.IsSelected && p.IsPago);
    public int SelectedPrevistoCount => DisplayPagamentos.Count(p => p.IsSelected && p.IsPrevisto);
    public decimal SelectedPaidTotalValor => DisplayPagamentos.Where(p => p.IsSelected && p.IsPago).Sum(p => p.Valor);
    public string SelectedPaidTotalValorFormatado => SelectedPaidTotalValor.ToString("C2", PtBr);
    public bool HasSelectedPayments => SelectedCount > 0;
    public bool HasSelectedPaid => SelectedPaidCount > 0;
    public bool HasSelectedPrevisto => SelectedPrevistoCount > 0;
    public bool IsAllSelected => DisplayPagamentos.Count > 0 && DisplayPagamentos.All(p => p.IsSelected);

    // --- Estado do Visualizador de Folha A4 (Recibo Legal) ---
    [ObservableProperty]
    private bool _isReceiptPreviewOpen;

    [ObservableProperty]
    private bool _isBatchReceiptPreview;

    [ObservableProperty]
    private ObservableCollection<PagamentoItemViewModel> _batchPreviewList = new();

    [ObservableProperty]
    private int _batchCurrentIndex;

    [ObservableProperty]
    private PagamentoItemViewModel? _selectedBatchItem;

    partial void OnSelectedBatchItemChanged(PagamentoItemViewModel? value)
    {
        if (value != null && value != CurrentReceiptPayment && BatchPreviewList.Contains(value))
        {
            BatchCurrentIndex = BatchPreviewList.IndexOf(value);
            LoadCurrentReceipt(value);
        }
    }

    public bool CanGoNext => BatchPreviewList.Count > 0 && BatchCurrentIndex < BatchPreviewList.Count - 1;
    public bool CanGoPrev => BatchCurrentIndex > 0;
    public int BatchCurrentIndexPlusOne => BatchCurrentIndex + 1;

    public string TotalBatchValorFormatado => NumberToWordsPtBr.FormatarNumeroMoeda(BatchPreviewList.Sum(p => p.Model.Valor));
    public string SuggestedBatchFileName => IsBatchReceiptPreview 
        ? $"RECIBOS_LOTE_{DateTime.Now:yyyyMMdd_HHmmss}.zip" 
        : (CurrentReceiptPayment != null ? QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(CurrentReceiptPayment.Model) : "RECIBO.pdf");

    [ObservableProperty]
    private PagamentoItemViewModel? _currentReceiptPayment;

    [ObservableProperty]
    private ReceiptDisplayItem? _currentReceiptDisplay;

    [ObservableProperty]
    private string _receiptIndexDisplay = "Via 1 de 1";

    [ObservableProperty]
    private string _receiptTitulo = "Recibo de Pagamento";

    [ObservableProperty]
    private string _receiptVia = "1ª VIA";

    [ObservableProperty]
    private string _receiptParagrafo1 = string.Empty;

    [ObservableProperty]
    private string _receiptParagrafo2 = string.Empty;

    [ObservableProperty]
    private string _receiptParagrafo3 = string.Empty;

    [ObservableProperty]
    private string _receiptParagrafo4 = "Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.";

    [ObservableProperty]
    private string _receiptDataLocal = string.Empty;

    [ObservableProperty]
    private string _receiptAssinaturaNome = string.Empty;

    [ObservableProperty]
    private string _receiptAssinaturaCpf = string.Empty;

    // --- Estado do Modal de Confirmação Estilizado ---
    [ObservableProperty]
    private bool _isConfirmDialogOpen;

    [ObservableProperty]
    private string _confirmDialogTitle = string.Empty;

    [ObservableProperty]
    private string _confirmDialogMessage = string.Empty;

    [ObservableProperty]
    private string _confirmDialogSubMessage = string.Empty;

    [ObservableProperty]
    private string _confirmDialogDetail1 = string.Empty;

    [ObservableProperty]
    private string _confirmDialogDetail2 = string.Empty;

    [ObservableProperty]
    private string _confirmDialogConfirmLabel = "Confirmar";

    [ObservableProperty]
    private string _confirmDialogVariant = "emerald"; // emerald, amber, red

    private Func<Task>? _confirmAction;

    // --- Notificações Toast ---
    [ObservableProperty]
    private string _notificationMessage = string.Empty;

    [ObservableProperty]
    private bool _isNotificationVisible;

    [ObservableProperty]
    private string _notificationType = "info"; // success, error, info, warning

    // --- Callbacks Nativos ---
    public Func<Pagamento?, Task<bool>>? OnRequestPaymentDialog;
    public Func<Beneficiario, Task<bool>>? OnRequestBeneficiaryDialog;
    public Func<IReadOnlyList<Pagamento>, Task>? OnRequestReceiptPreviewDialog;
    public Func<string, string, string, string, Task<string?>>? OnRequestSaveFileDialog;
    public Action<string>? OnOpenFilePath;

    public MainWindowViewModel()
    {
        _connectionFactory = new SqliteDbConnectionFactory();
        _connectionFactory.InitializeDatabase();

        _contratoRepo = new ContratoRepository(_connectionFactory);
        _beneficiarioRepo = new BeneficiarioRepository(_connectionFactory);
        _pagamentoRepo = new PagamentoRepository(_connectionFactory);
        _excelEngine = new ExcelSyncEngine();
        _syncService = new SyncService(_excelEngine, _beneficiarioRepo, _pagamentoRepo);

        _ = LoadInitialDataAsync();
    }

    public async Task LoadInitialDataAsync()
    {
        try
        {
            await new DbSeeder(_contratoRepo, _beneficiarioRepo).SeedInitialDataAsync();

            var contrato = await _contratoRepo.GetAsync();
            Contrato = contrato;
            if (contrato != null)
            {
                ContratoPagadorNome = contrato.PagadorNome;
                ContratoPagadorCpf = contrato.PagadorCpf;
                ContratoPagadorBanco = contrato.PagadorBanco ?? "104 - Caixa Econômica Federal";
                ContratoTitulo = contrato.TituloContrato;
                ContratoData = contrato.DataContrato;
            }

            var bens = await _beneficiarioRepo.GetAllAsync();
            Beneficiarios = new ObservableCollection<Beneficiario>(bens);

            ContractParties.Clear();
            int pIndex = 1;
            foreach (var b in bens)
            {
                ContractParties.Add(new ContractPartyViewModel(b, pIndex++));
            }

            BeneficiarioFilterOptions.Clear();
            BeneficiarioFilterOptions.Add("Todos");
            foreach (var b in bens)
            {
                BeneficiarioFilterOptions.Add(b.Nome);
            }

            var pags = await _pagamentoRepo.GetAllAsync();
            _allPagamentos = pags.OrderBy(p => p.ParcelaNumero).ThenBy(p => p.BeneficiarioNome).ToList();

            TotalCount = _allPagamentos.Count;
            TotalPaidCount = _allPagamentos.Count(p => p.Status == StatusParcela.Pago);
            TotalPrevistoCount = _allPagamentos.Count(p => p.Status == StatusParcela.Previsto);

            RecalculateTotals();
            ApplyFilter();
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao carregar dados locais: {ex.Message}", "error");
        }
    }

    private void RecalculateTotals()
    {
        decimal totalContrato = Beneficiarios.Sum(b => b.ContratoTotal);
        if (totalContrato <= 0) totalContrato = 90000m;

        decimal totalPago = _allPagamentos
            .Where(p => p.Status == StatusParcela.Pago)
            .Sum(p => p.Valor);

        decimal totalComprometido = Math.Max(0, totalContrato - totalPago);

        TotalContrato = totalContrato;
        TotalPago = totalPago;
        TotalComprometido = totalComprometido;

        double pctPago = totalContrato > 0 ? (double)(totalPago / totalContrato) : 0;
        double pctComp = totalContrato > 0 ? (double)(totalComprometido / totalContrato) : 0;

        PorcentagemPago = $"{pctPago:P1}";
        PorcentagemComprometido = $"{pctComp:P1}";

        OnPropertyChanged(nameof(TotalPagoFormatado));
        OnPropertyChanged(nameof(TotalComprometidoFormatado));

        UpdateBeneficiarioCards();
    }

    private void UpdateBeneficiarioCards()
    {
        BeneficiarioCards.Clear();
        foreach (var b in Beneficiarios)
        {
            var card = new BeneficiarioCardViewModel(b, _allPagamentos)
            {
                OpenEditCallback = (ben) => _ = OpenEditBeneficiaryAsync(ben),
                NavigateToPaymentsCallback = (nome) => NavigateToCedentePayments(nome),
                CopyPixCallback = (chave) => _ = CopyPixAsync(chave)
            };
            BeneficiarioCards.Add(card);
        }
    }

    partial void OnSearchQueryChanged(string value) => ApplyFilter();
    partial void OnSelectedBeneficiarioFilterChanged(string value) => ApplyFilter();
    partial void OnSelectedStatusFilterChanged(string value) => ApplyFilter();

    [RelayCommand]
    private void ClearSearch()
    {
        SearchQuery = string.Empty;
    }

    private void ApplyFilter()
    {
        var filtered = _allPagamentos.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(SearchQuery))
        {
            var q = SearchQuery.Trim().ToLowerInvariant();
            filtered = filtered.Where(p =>
                p.BeneficiarioNome.ToLowerInvariant().Contains(q) ||
                p.ParcelaNumero.ToString().Contains(q) ||
                p.Valor.ToString().Contains(q) ||
                (p.DataPagamento != null && p.DataPagamento.Contains(q)) ||
                (p.DataPrevista != null && p.DataPrevista.Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(SelectedBeneficiarioFilter) && SelectedBeneficiarioFilter != "Todos")
        {
            filtered = filtered.Where(p => p.BeneficiarioNome.Equals(SelectedBeneficiarioFilter, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(SelectedStatusFilter) && SelectedStatusFilter != "Todos")
        {
            if (SelectedStatusFilter.Equals("PAGO", StringComparison.OrdinalIgnoreCase))
                filtered = filtered.Where(p => p.Status == StatusParcela.Pago);
            else if (SelectedStatusFilter.Equals("PREVISTO", StringComparison.OrdinalIgnoreCase))
                filtered = filtered.Where(p => p.Status == StatusParcela.Previsto);
        }

        var items = filtered.OrderBy(p => p.ParcelaNumero).ThenBy(p => p.BeneficiarioNome).Select(p =>
        {
            var itemVm = new PagamentoItemViewModel(p);
            itemVm.SelectionChangedCallback = _ => OnItemSelectionChanged();
            itemVm.ToggleStatusCallback = vm => ToggleStatus(vm);
            itemVm.OpenPreviewCallback = vm => _ = OpenSingleReceiptPreviewAsync(vm);
            itemVm.EditCallback = vm => _ = EditPaymentAsync(vm);
            itemVm.DeleteCallback = vm => DeletePayment(vm);
            return itemVm;
        }).ToList();

        DisplayPagamentos = new ObservableCollection<PagamentoItemViewModel>(items);

        VisibleCount = DisplayPagamentos.Count;
        VisiblePaidCount = DisplayPagamentos.Count(p => p.IsPago);
        VisiblePrevistoCount = DisplayPagamentos.Count(p => p.IsPrevisto);

        OnItemSelectionChanged();
    }

    private void OnItemSelectionChanged()
    {
        OnPropertyChanged(nameof(SelectedCount));
        OnPropertyChanged(nameof(SelectedPaidCount));
        OnPropertyChanged(nameof(SelectedPrevistoCount));
        OnPropertyChanged(nameof(SelectedPaidTotalValor));
        OnPropertyChanged(nameof(SelectedPaidTotalValorFormatado));
        OnPropertyChanged(nameof(HasSelectedPayments));
        OnPropertyChanged(nameof(HasSelectedPaid));
        OnPropertyChanged(nameof(HasSelectedPrevisto));
        OnPropertyChanged(nameof(IsAllSelected));
    }

    [RelayCommand]
    private void SelectAllVisible()
    {
        bool selectAll = !IsAllSelected;
        foreach (var item in DisplayPagamentos)
        {
            item.IsSelected = selectAll;
        }
        OnItemSelectionChanged();
    }

    [RelayCommand]
    private void SelectOnlyPaid()
    {
        foreach (var item in DisplayPagamentos)
        {
            item.IsSelected = item.IsPago;
        }
        OnItemSelectionChanged();
    }

    [RelayCommand]
    private void SelectOnlyPrevisto()
    {
        foreach (var item in DisplayPagamentos)
        {
            item.IsSelected = item.IsPrevisto;
        }
        OnItemSelectionChanged();
    }

    [RelayCommand]
    private void ClearSelection()
    {
        foreach (var item in DisplayPagamentos)
        {
            item.IsSelected = false;
        }
        OnItemSelectionChanged();
    }

    [RelayCommand]
    private void SelectTab(object? param)
    {
        if (param is int i)
        {
            SelectedTabIndex = i;
        }
        else if (param != null && int.TryParse(param.ToString(), out int parsed))
        {
            SelectedTabIndex = parsed;
        }
    }

    [RelayCommand]
    private void NavigateToCedentePayments(string? cedenteNome)
    {
        if (!string.IsNullOrWhiteSpace(cedenteNome))
        {
            SelectedBeneficiarioFilter = cedenteNome;
        }
        SelectedTabIndex = 1;
    }

    [RelayCommand]
    private async Task CopyPixAsync(string? chave)
    {
        if (string.IsNullOrWhiteSpace(chave)) return;
        try
        {
            if (Avalonia.Application.Current?.ApplicationLifetime is Avalonia.Controls.ApplicationLifetimes.IClassicDesktopStyleApplicationLifetime desktop)
            {
                var topLevel = Avalonia.Controls.TopLevel.GetTopLevel(desktop.MainWindow);
                if (topLevel?.Clipboard != null)
                {
                    await topLevel.Clipboard.SetTextAsync(chave);
                    ShowNotification($"Chave PIX copiada: {chave}", "success");
                    return;
                }
            }
            ShowNotification($"Chave PIX: {chave}", "info");
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao copiar chave: {ex.Message}", "error");
        }
    }

    // --- Modal de Confirmação Interativo ---
    public void OpenConfirmDialog(
        string title,
        string message,
        string subMessage,
        string detail1,
        string detail2,
        string confirmLabel,
        string variant,
        Func<Task> onConfirm)
    {
        ConfirmDialogTitle = title;
        ConfirmDialogMessage = message;
        ConfirmDialogSubMessage = subMessage;
        ConfirmDialogDetail1 = detail1;
        ConfirmDialogDetail2 = detail2;
        ConfirmDialogConfirmLabel = confirmLabel;
        ConfirmDialogVariant = variant;
        _confirmAction = onConfirm;
        IsConfirmDialogOpen = true;
    }

    [RelayCommand]
    private async Task ExecuteConfirmAsync()
    {
        IsConfirmDialogOpen = false;
        if (_confirmAction != null)
        {
            await _confirmAction.Invoke();
        }
    }

    [RelayCommand]
    private void CancelConfirm()
    {
        IsConfirmDialogOpen = false;
        _confirmAction = null;
    }

    // --- Ações em Lote ---
    [RelayCommand]
    private void BatchQuitar()
    {
        var previstos = DisplayPagamentos.Where(p => p.IsSelected && p.IsPrevisto).ToList();
        if (previstos.Count == 0) return;

        decimal total = previstos.Sum(p => p.Valor);
        OpenConfirmDialog(
            "Liquidação em Lote de Parcelas",
            $"Confirma a quitação de {previstos.Count} parcelas previstas selecionadas?",
            "As parcelas serão marcadas como PAGAS com a data de hoje, e os saldos contratuais serão atualizados imediatamente.",
            $"Quantidade: {previstos.Count} parcela(s)",
            $"Montante Total: {total:C2}",
            $"Quitar {previstos.Count} Parcelas",
            "emerald",
            async () =>
            {
                var dtHoje = DateTime.Now;
                foreach (var item in previstos)
                {
                    var quitado = item.Model with
                    {
                        Status = StatusParcela.Pago,
                        DataPagamento = dtHoje.ToString("yyyy-MM-dd"),
                        Dia = dtHoje.Day.ToString("00"),
                        Mes = dtHoje.ToString("MMMM", PtBr),
                        Ano = dtHoje.Year.ToString()
                    };
                    await _pagamentoRepo.SaveAsync(quitado);
                }
                await LoadInitialDataAsync();
                ShowNotification($"{previstos.Count} parcelas quitadas com sucesso!", "success");
            });
    }

    [RelayCommand]
    private void BatchReverter()
    {
        var pagos = DisplayPagamentos.Where(p => p.IsSelected && p.IsPago).ToList();
        if (pagos.Count == 0) return;

        decimal total = pagos.Sum(p => p.Valor);
        OpenConfirmDialog(
            "Reversão de Lote para Previsto",
            $"Deseja estornar a quitação de {pagos.Count} parcelas pagas selecionadas?",
            "O status retornará para PREVISTO, e os saldos devedores serão recalculados no controle contratual.",
            $"Quantidade: {pagos.Count} parcela(s)",
            $"Montante Total: {total:C2}",
            $"Reverter {pagos.Count} Parcelas",
            "amber",
            async () =>
            {
                foreach (var item in pagos)
                {
                    var revertido = item.Model with
                    {
                        Status = StatusParcela.Previsto,
                        DataPagamento = null
                    };
                    await _pagamentoRepo.SaveAsync(revertido);
                }
                await LoadInitialDataAsync();
                ShowNotification($"{pagos.Count} parcelas revertidas para PREVISTO com sucesso!", "success");
            });
    }

    [RelayCommand]
    private async Task OpenEditBeneficiaryAsync(Beneficiario? b)
    {
        if (b == null) return;
        if (OnRequestBeneficiaryDialog != null)
        {
            var ok = await OnRequestBeneficiaryDialog.Invoke(b);
            if (ok)
            {
                await LoadInitialDataAsync();
                ShowNotification("Dados bancários e do cedente atualizados com sucesso!", "success");
            }
        }
    }

    [RelayCommand]
    private async Task BatchEmitirRecibosAsync()
    {
        var pagos = DisplayPagamentos.Where(p => p.IsSelected && p.IsPago).ToList();
        if (pagos.Count == 0)
        {
            var selectedAny = DisplayPagamentos.Where(p => p.IsSelected).ToList();
            if (selectedAny.Count > 0 && selectedAny.All(p => p.IsPrevisto))
            {
                ShowNotification("As parcelas selecionadas possuem status PREVISTO. Recibos são gerados apenas para parcelas quitadas (PAGO).", "warning");
                return;
            }

            pagos = DisplayPagamentos.Where(p => p.IsPago).ToList();
        }

        if (pagos.Count == 0)
        {
            ShowNotification("Nenhuma parcela paga encontrada para emissão de recibo.", "warning");
            return;
        }

        if (OnRequestReceiptPreviewDialog != null)
        {
            await OnRequestReceiptPreviewDialog.Invoke(pagos.Select(p => p.Model).ToList());
        }
        else
        {
            OpenBatchReceiptPreview(pagos);
        }
    }

    // --- Alternar Status da Linha com 1 Clique (Interativo) ---
    [RelayCommand]
    private void ToggleStatus(PagamentoItemViewModel? item)
    {
        if (item == null) return;
        if (item.IsPrevisto)
        {
            OpenConfirmDialog(
                "Quitação de Parcela",
                $"Confirma a quitação da parcela {item.ParcelaNumero} de {item.BeneficiarioNome}?",
                "A parcela será marcada como PAGA e estará pronta para emissão de recibo civil oficial.",
                $"Valor: {item.ValorFormatado}",
                $"Beneficiário: {item.BeneficiarioNome}",
                "Confirmar Quitação",
                "emerald",
                async () =>
                {
                    var dtHoje = DateTime.Now;
                    var quitado = item.Model with
                    {
                        Status = StatusParcela.Pago,
                        DataPagamento = dtHoje.ToString("yyyy-MM-dd"),
                        Dia = dtHoje.Day.ToString("00"),
                        Mes = dtHoje.ToString("MMMM", PtBr),
                        Ano = dtHoje.Year.ToString()
                    };
                    await _pagamentoRepo.SaveAsync(quitado);
                    await LoadInitialDataAsync();
                    ShowNotification($"Parcela {item.ParcelaNumero} quitada com sucesso!", "success");
                });
        }
        else
        {
            OpenConfirmDialog(
                "Reversão para Previsto",
                $"Deseja estornar a quitação da parcela {item.ParcelaNumero} de {item.BeneficiarioNome}?",
                "O status retornará para PREVISTO e o saldo devedor será recalculado.",
                $"Valor: {item.ValorFormatado}",
                $"Beneficiário: {item.BeneficiarioNome}",
                "Reverter para Previsto",
                "amber",
                async () =>
                {
                    var rev = item.Model with
                    {
                        Status = StatusParcela.Previsto,
                        DataPagamento = null
                    };
                    await _pagamentoRepo.SaveAsync(rev);
                    await LoadInitialDataAsync();
                    ShowNotification($"Parcela {item.ParcelaNumero} revertida com sucesso!", "success");
                });
        }
    }

    [RelayCommand]
    private void DeletePayment(PagamentoItemViewModel? item)
    {
        if (item == null) return;
        OpenConfirmDialog(
            "Exclusão de Parcela",
            $"Tem certeza que deseja excluir o registro da parcela {item.ParcelaNumero} de {item.BeneficiarioNome}?",
            "Esta operação removerá o registro do banco de dados permanentemente.",
            $"Valor: {item.ValorFormatado}",
            $"Parcela: Nº {item.ParcelaNumero}",
            "Excluir Registro",
            "red",
            async () =>
            {
                await _pagamentoRepo.DeleteAsync(item.Id);
                await LoadInitialDataAsync();
                ShowNotification($"Parcela {item.ParcelaNumero} excluída com sucesso!", "success");
            });
    }

    // --- Visualizador Nativo de Folha A4 ---
    [RelayCommand]
    private async Task OpenSingleReceiptPreviewAsync(PagamentoItemViewModel? item)
    {
        if (item == null) return;
        if (OnRequestReceiptPreviewDialog != null)
        {
            await OnRequestReceiptPreviewDialog.Invoke(new List<Pagamento> { item.Model });
        }
        else
        {
            item.BatchSequenceIndex = 1;
            IsBatchReceiptPreview = false;
            BatchPreviewList = new ObservableCollection<PagamentoItemViewModel> { item };
            BatchCurrentIndex = 0;
            LoadCurrentReceipt(item);
            IsReceiptPreviewOpen = true;
        }
    }

    public void OpenBatchReceiptPreview(List<PagamentoItemViewModel> items)
    {
        if (items.Count == 0) return;
        for (int i = 0; i < items.Count; i++)
        {
            items[i].BatchSequenceIndex = i + 1;
        }
        IsBatchReceiptPreview = items.Count > 1;
        BatchPreviewList = new ObservableCollection<PagamentoItemViewModel>(items);
        BatchCurrentIndex = 0;
        LoadCurrentReceipt(items[0]);
        IsReceiptPreviewOpen = true;
    }

    [RelayCommand]
    private void ExpandAllParties()
    {
        foreach (var p in ContractParties) p.IsExpanded = true;
    }

    [RelayCommand]
    private void CollapseAllParties()
    {
        foreach (var p in ContractParties) p.IsExpanded = false;
    }

    [RelayCommand]
    private async Task SaveContractAsync()
    {
        try
        {
            if (Contrato != null)
            {
                var updatedContrato = Contrato with
                {
                    PagadorNome = ContratoPagadorNome,
                    PagadorCpf = ContratoPagadorCpf,
                    PagadorBanco = ContratoPagadorBanco,
                    TituloContrato = ContratoTitulo,
                    DataContrato = ContratoData,
                    UpdatedAt = DateTime.UtcNow
                };
                await _contratoRepo.SaveAsync(updatedContrato);
            }
            foreach (var partyVm in ContractParties)
            {
                var updatedBen = partyVm.ToUpdatedBeneficiario();
                await _beneficiarioRepo.SaveAsync(updatedBen);
            }
            await LoadInitialDataAsync();
            ShowNotification("Configurações do contrato e beneficiários salvas com sucesso!", "success");
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao salvar contrato: {ex.Message}", "error");
        }
    }

    [RelayCommand]
    private void RestaurarPlanilha()
    {
        OpenConfirmDialog(
            "Restaurar Dados Originais",
            "Tem certeza que deseja restaurar os dados originais da planilha 'CONTROLE PAGAMENTOS.xlsx'?",
            "Esta ação recarregará os dados da planilha oficial mantendo as fórmulas e informações originais.",
            "Origem: CONTROLE PAGAMENTOS.xlsx",
            "Destino: Banco de Dados SQLite Local",
            "Sim, Restaurar Dados",
            "amber",
            async () =>
            {
                await SyncExcelAsync();
                ShowNotification("Dados originais restaurados com sucesso a partir da planilha!", "success");
            });
    }

    private void LoadCurrentReceipt(PagamentoItemViewModel item)
    {
        CurrentReceiptPayment = item;
        ReceiptIndexDisplay = IsBatchReceiptPreview
            ? $"Via {BatchCurrentIndex + 1} de {BatchPreviewList.Count}"
            : "Recibo Individual";

        var c = Contrato ?? new ContratoConfig
        {
            PagadorNome = "ABIGAIL PAULINO DA SILVA",
            PagadorCpf = "450.519.504-00",
            TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
            DataContrato = "19 de agosto de 2025"
        };

        var pag = item.Model;
        var valorFormatado = NumberToWordsPtBr.FormatarNumeroMoeda(pag.Valor);
        var valorExtenso = NumberToWordsPtBr.ValorPorExtenso(pag.Valor);
        var saldoFormatado = NumberToWordsPtBr.FormatarNumeroMoeda(pag.SaldoAposParcela);
        var saldoExtenso = NumberToWordsPtBr.ValorPorExtenso(pag.SaldoAposParcela);

        string dataPtBr = item.PagamentoFormatado;
        if (dataPtBr == "-") dataPtBr = item.PrevisaoFormatada;

        var tituloLimpo = Regex.Replace(c.TituloContrato ?? "Contrato de Promessa de Cessão de Direitos Hereditários", @",?\s*firmado\s+em.*$", "", RegexOptions.IgnoreCase).Trim();
        tituloLimpo = tituloLimpo.TrimEnd('.');

        ReceiptParagrafo1 = $"Eu, {pag.BeneficiarioNome}, inscrito(a) no CPF nº {pag.BeneficiarioCpf}, declaro que recebi de {c.PagadorNome}, CPF nº {c.PagadorCpf}, a quantia de R$ {valorFormatado} ({valorExtenso}), no dia {dataPtBr}, referente à parcela nº {pag.ParcelaNumero} do {tituloLimpo}, firmado em {c.DataContrato}.";

        var forma = (pag.FormaPgto ?? "PIX").Trim().ToUpperInvariant();
        if (forma.Contains("ESPÉCIE") || forma.Contains("ESPECIE"))
        {
            ReceiptParagrafo2 = "Pagamento recebido em espécie (moeda corrente nacional).";
        }
        else
        {
            var bancoPuro = QuestPdfReceiptGenerator.ExtrairNomePuroBanco(pag.Banco);
            string bancoComplemento = !string.IsNullOrEmpty(bancoPuro) ? $", {bancoPuro}" : string.Empty;
            ReceiptParagrafo2 = $"Pagamento recebido através da chave Pix nº {pag.ChavePix}{bancoComplemento}.";
        }

        ReceiptParagrafo3 = $"Após este pagamento, o saldo devedor atualizado referente à minha parte é de R$ {saldoFormatado} ({saldoExtenso}).";

        string dia = !string.IsNullOrWhiteSpace(pag.Dia) ? pag.Dia : DateTime.Now.Day.ToString("00");
        string mes = !string.IsNullOrWhiteSpace(pag.Mes) ? pag.Mes : DateTime.Now.ToString("MMMM", PtBr);
        string ano = !string.IsNullOrWhiteSpace(pag.Ano) ? pag.Ano : DateTime.Now.Year.ToString();
        string cidadeUf = !string.IsNullOrWhiteSpace(pag.CidadeUf) ? pag.CidadeUf : "Santa Cecília do Pavão - PR";

        ReceiptDataLocal = $"{cidadeUf}, {dia} de {mes} de {ano}";
        ReceiptAssinaturaNome = pag.BeneficiarioNome;
        ReceiptAssinaturaCpf = $"CPF: {pag.BeneficiarioCpf}";

        var ben = Beneficiarios.FirstOrDefault(b => b.Id == pag.BeneficiarioId) ?? new Beneficiario
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
        CurrentReceiptDisplay = new ReceiptDisplayItem(pag, ben, c);

        SelectedBatchItem = item;
        OnPropertyChanged(nameof(CanGoNext));
        OnPropertyChanged(nameof(CanGoPrev));
        OnPropertyChanged(nameof(BatchCurrentIndexPlusOne));
        OnPropertyChanged(nameof(TotalBatchValorFormatado));
        OnPropertyChanged(nameof(SuggestedBatchFileName));
    }

    [RelayCommand]
    private void NextReceipt()
    {
        if (BatchCurrentIndex < BatchPreviewList.Count - 1)
        {
            BatchCurrentIndex++;
            LoadCurrentReceipt(BatchPreviewList[BatchCurrentIndex]);
        }
    }

    [RelayCommand]
    private void PreviousReceipt()
    {
        if (BatchCurrentIndex > 0)
        {
            BatchCurrentIndex--;
            LoadCurrentReceipt(BatchPreviewList[BatchCurrentIndex]);
        }
    }

    [RelayCommand]
    private void CloseReceiptPreview()
    {
        IsReceiptPreviewOpen = false;
        CurrentReceiptPayment = null;
    }

    [RelayCommand]
    private async Task DownloadCurrentReceiptPdfAsync()
    {
        if (CurrentReceiptPayment == null) return;
        await EmitirReciboPdfAsync(CurrentReceiptPayment.Model);
    }

    [RelayCommand]
    private async Task DownloadBatchZipAsync()
    {
        if (BatchPreviewList.Count == 0) return;

        try
        {
            string defaultZipName = $"RECIBOS_LOTE_{DateTime.Now:yyyyMMdd_HHmmss}.zip";
            if (OnRequestSaveFileDialog != null)
            {
                var targetPath = await OnRequestSaveFileDialog.Invoke(
                    "Salvar Pacote de Recibos em ZIP",
                    defaultZipName,
                    "zip",
                    "Arquivo Compactado ZIP (*.zip)");

                if (!string.IsNullOrWhiteSpace(targetPath))
                {
                    var contrato = GetSafeContrato();
                    var gen = new QuestPdfReceiptGenerator();

                    using var zipStream = new MemoryStream();
                    using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
                    {
                        var setNomes = new HashSet<string>();
                        foreach (var item in BatchPreviewList)
                        {
                            var ben = await GetSafeBeneficiarioAsync(item);
                            var dados = new ReciboDados(item.Model, ben, contrato);
                            var pdf = gen.GerarReciboPdf(dados);

                            string baseName = QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(item.Model);
                            string entryName = baseName;
                            int dup = 1;
                            while (setNomes.Contains(entryName))
                            {
                                entryName = QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(item.Model, dup++);
                            }
                            setNomes.Add(entryName);

                            var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
                            using var entryStream = entry.Open();
                            await entryStream.WriteAsync(pdf);
                        }
                    }

                    await File.WriteAllBytesAsync(targetPath, zipStream.ToArray());
                    ShowNotification($"Pacote com {BatchPreviewList.Count} recibos salvo em: {targetPath}", "success");
                    OnOpenFilePath?.Invoke(targetPath);
                    CloseReceiptPreview();
                }
            }
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao gerar pacote ZIP: {ex.Message}", "error");
        }
    }

    private ContratoConfig GetSafeContrato()
    {
        return Contrato ?? new ContratoConfig
        {
            PagadorNome = "ABIGAIL PAULINO DA SILVA",
            PagadorCpf = "450.519.504-00",
            TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
            DataContrato = "19 de agosto de 2025"
        };
    }

    private async Task<Beneficiario> GetSafeBeneficiarioAsync(PagamentoItemViewModel item)
    {
        var ben = await _beneficiarioRepo.GetByIdAsync(item.BeneficiarioId);
        if (ben != null) return ben;
        return new Beneficiario
        {
            Id = item.BeneficiarioId,
            Nome = item.BeneficiarioNome,
            Cpf = item.BeneficiarioCpf,
            Status = item.IsPago ? "PAGO" : "EM ABERTO",
            Banco = item.Banco,
            TipoConta = "CORRENTE",
            ChavePix = item.ChavePix,
            CidadeUf = "Santa Cecília do Pavão - PR"
        };
    }

    [RelayCommand]
    private async Task PrintCurrentReceiptAsync()
    {
        if (CurrentReceiptPayment == null) return;
        try
        {
            var contrato = GetSafeContrato();
            var ben = await GetSafeBeneficiarioAsync(CurrentReceiptPayment);
            var dados = new ReciboDados(CurrentReceiptPayment.Model, ben, contrato);
            var pdfBytes = new QuestPdfReceiptGenerator().GerarReciboPdf(dados);

            string tempPath = Path.Combine(Path.GetTempPath(), QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(CurrentReceiptPayment.Model));
            await File.WriteAllBytesAsync(tempPath, pdfBytes);

            OnOpenFilePath?.Invoke(tempPath);
            ShowNotification("Recibo aberto no visualizador do sistema para impressão.", "info");
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao imprimir recibo: {ex.Message}", "error");
        }
    }

    [RelayCommand]
    private async Task OpenNewPaymentAsync()
    {
        if (OnRequestPaymentDialog != null)
        {
            var result = await OnRequestPaymentDialog.Invoke(null);
            if (result)
            {
                await LoadInitialDataAsync();
                ShowNotification("Pagamento cadastrado com sucesso!", "success");
            }
        }
    }

    [RelayCommand]
    private async Task EditPaymentAsync(PagamentoItemViewModel? item)
    {
        if (item == null) return;
        if (OnRequestPaymentDialog != null)
        {
            var result = await OnRequestPaymentDialog.Invoke(item.Model);
            if (result)
            {
                await LoadInitialDataAsync();
                ShowNotification($"Parcela {item.ParcelaNumero} atualizada!", "success");
            }
        }
    }

    [RelayCommand]
    private void QuitarParcela(PagamentoItemViewModel? item)
    {
        if (item == null) return;
        ToggleStatus(item);
    }

    [RelayCommand]
    private async Task EmitirReciboPdfAsync(Pagamento? pagamento)
    {
        if (pagamento == null) return;

        try
        {
            var contrato = Contrato ?? new ContratoConfig
            {
                PagadorNome = "ABIGAIL PAULINO DA SILVA",
                PagadorCpf = "450.519.504-00",
                TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
                DataContrato = "19 de agosto de 2025"
            };

            var ben = await _beneficiarioRepo.GetByIdAsync(pagamento.BeneficiarioId);
            if (ben == null)
            {
                ShowNotification("Beneficiário não encontrado para emissão do recibo.", "error");
                return;
            }
            var dados = new ReciboDados(pagamento, ben, contrato);
            var pdfBytes = new QuestPdfReceiptGenerator().GerarReciboPdf(dados);

            string defaultFileName = QuestPdfReceiptGenerator.GerarNomeArquivoRecibo(pagamento);

            if (OnRequestSaveFileDialog != null)
            {
                var targetPath = await OnRequestSaveFileDialog.Invoke(
                    "Salvar Recibo em PDF",
                    defaultFileName,
                    "pdf",
                    "Documento PDF (*.pdf)");

                if (!string.IsNullOrWhiteSpace(targetPath))
                {
                    await File.WriteAllBytesAsync(targetPath, pdfBytes);
                    ShowNotification($"Recibo PDF salvo em: {targetPath}", "success");
                    OnOpenFilePath?.Invoke(targetPath);
                }
            }
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao emitir recibo em PDF: {ex.Message}", "error");
        }
    }

    private async Task<string> ResolveExcelPathAsync()
    {
        if (File.Exists(PrimaryOneDriveExcelPath)) return PrimaryOneDriveExcelPath;
        var c = await _contratoRepo.GetAsync();
        if (!string.IsNullOrEmpty(c?.OnedriveExcelPath) && File.Exists(c.OnedriveExcelPath)) return c.OnedriveExcelPath;
        
        string localFallback = Path.Combine(AppContext.BaseDirectory, "CONTROLE PAGAMENTOS.xlsx");
        if (File.Exists(localFallback)) return localFallback;

        string repoRootFallback = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "CONTROLE PAGAMENTOS.xlsx");
        if (File.Exists(repoRootFallback)) return Path.GetFullPath(repoRootFallback);

        return PrimaryOneDriveExcelPath;
    }

    [RelayCommand]
    private async Task SyncExcelAsync()
    {
        try
        {
            ShowNotification("Sincronizando com a planilha Excel do OneDrive...", "info");
            var excelPath = await ResolveExcelPathAsync();

            if (!File.Exists(excelPath))
            {
                ShowNotification($"Planilha Excel não encontrada em: {excelPath}", "warning");
                return;
            }

            var result = await _syncService.ImportarPlanilhaParaBancoAsync(excelPath);

            if (result.IsSuccess)
            {
                await LoadInitialDataAsync();
                ShowNotification($"Sincronização com Excel concluída! {result.Value.BeneficiariosImportados} beneficiários, {result.Value.PagamentosImportados} parcelas.", "success");
            }
            else
            {
                ShowNotification($"Aviso na sincronização: {result.Error}", "warning");
            }
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao sincronizar com Excel: {ex.Message}", "error");
        }
    }

    [RelayCommand]
    private async Task ExportCsvAsync()
    {
        try
        {
            string defaultName = $"CONTROLE_PAGAMENTOS_{DateTime.Now:yyyy-MM-dd}.csv";
            if (OnRequestSaveFileDialog != null)
            {
                var targetPath = await OnRequestSaveFileDialog.Invoke(
                    "Salvar Planilha de Pagamentos CSV",
                    defaultName,
                    "csv",
                    "Arquivo CSV (*.csv)");

                if (!string.IsNullOrWhiteSpace(targetPath))
                {
                    var lines = new List<string>
                    {
                        "PARCELA;BENEFICIARIO;CPF;VALOR;STATUS;DATA_PREVISTA;DATA_PAGAMENTO;FORMA_PGTO;CHAVE_PIX;BANCO;SALDO"
                    };

                    foreach (var p in _allPagamentos.OrderBy(x => x.ParcelaNumero))
                    {
                        lines.Add($"{p.ParcelaNumero};{p.BeneficiarioNome};{p.BeneficiarioCpf};{p.Valor:F2};{p.Status};{p.DataPrevista};{p.DataPagamento};{p.FormaPgto};{p.ChavePix};{p.Banco};{p.SaldoAposParcela:F2}");
                    }

                    await File.WriteAllLinesAsync(targetPath, lines, System.Text.Encoding.UTF8);
                    ShowNotification($"CSV exportado com sucesso em: {targetPath}", "success");
                    OnOpenFilePath?.Invoke(targetPath);
                }
            }
        }
        catch (Exception ex)
        {
            ShowNotification($"Erro ao exportar CSV: {ex.Message}", "error");
        }
    }

    public void ShowNotification(string message, string type = "info")
    {
        NotificationMessage = message;
        NotificationType = type;
        IsNotificationVisible = true;

        Task.Delay(5000).ContinueWith(_ =>
        {
            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                if (NotificationMessage == message)
                {
                    IsNotificationVisible = false;
                }
            });
        });
    }

    [RelayCommand]
    private void DismissNotification()
    {
        IsNotificationVisible = false;
    }
}

