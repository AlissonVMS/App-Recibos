using System;
using System.Collections.ObjectModel;
using System.Linq;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AppRecibos.Native.ViewModels;

public partial class PaymentDialogViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _id = Guid.NewGuid().ToString();

    [ObservableProperty]
    private ObservableCollection<Beneficiario> _beneficiarios = new();

    [ObservableProperty]
    private Beneficiario? _selectedBeneficiario;

    [ObservableProperty]
    private int _parcelaNumero = 15;

    [ObservableProperty]
    private decimal _valor = 1000m;

    [ObservableProperty]
    private DateTimeOffset? _dataPrevista = DateTimeOffset.Now;

    [ObservableProperty]
    private DateTimeOffset? _dataPagamento;

    [ObservableProperty]
    private bool _isPago;

    [ObservableProperty]
    private string _chavePix = string.Empty;

    [ObservableProperty]
    private string _banco = string.Empty;

    [ObservableProperty]
    private string _observacoes = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public bool IsConfirmed { get; private set; }

    public event Action? RequestClose;

    public PaymentDialogViewModel(ObservableCollection<Beneficiario> beneficiarios, Pagamento? existing = null)
    {
        Beneficiarios = beneficiarios;

        if (existing != null)
        {
            Id = existing.Id;
            SelectedBeneficiario = beneficiarios.FirstOrDefault(b => b.Id == existing.BeneficiarioId) ?? beneficiarios.FirstOrDefault();
            ParcelaNumero = existing.ParcelaNumero;
            Valor = existing.Valor;
            if (DateTime.TryParse(existing.DataPrevista, out var dp)) DataPrevista = dp;
            if (DateTime.TryParse(existing.DataPagamento, out var dpg))
            {
                DataPagamento = dpg;
                IsPago = true;
            }
            else
            {
                IsPago = existing.Status == StatusParcela.Pago;
            }
            ChavePix = existing.ChavePix;
            Banco = existing.Banco;
            Observacoes = existing.Observacoes ?? string.Empty;
        }
        else
        {
            SelectedBeneficiario = beneficiarios.FirstOrDefault();
            if (SelectedBeneficiario != null)
            {
                ChavePix = SelectedBeneficiario.ChavePix;
                Banco = SelectedBeneficiario.Banco;
            }
        }
    }

    partial void OnSelectedBeneficiarioChanged(Beneficiario? value)
    {
        if (value != null && string.IsNullOrWhiteSpace(ChavePix))
        {
            ChavePix = value.ChavePix;
            Banco = value.Banco;
        }
    }

    partial void OnIsPagoChanged(bool value)
    {
        if (value && DataPagamento == null)
        {
            DataPagamento = DateTimeOffset.Now;
        }
        else if (!value)
        {
            DataPagamento = null;
        }
    }

    [RelayCommand]
    private void Save()
    {
        if (SelectedBeneficiario == null)
        {
            ErrorMessage = "Selecione um beneficiário.";
            return;
        }

        if (Valor <= 0)
        {
            ErrorMessage = "O valor da parcela deve ser maior que zero.";
            return;
        }

        IsConfirmed = true;
        RequestClose?.Invoke();
    }

    [RelayCommand]
    private void Cancel()
    {
        IsConfirmed = false;
        RequestClose?.Invoke();
    }

    public Pagamento ToPagamento()
    {
        var b = SelectedBeneficiario!;
        var prevStr = DataPrevista?.ToString("yyyy-MM-dd") ?? DateTime.Now.ToString("yyyy-MM-dd");
        var pagStr = IsPago ? (DataPagamento?.ToString("yyyy-MM-dd") ?? DateTime.Now.ToString("yyyy-MM-dd")) : null;

        var dtForCalc = IsPago && DataPagamento.HasValue ? DataPagamento.Value.DateTime : (DataPrevista?.DateTime ?? DateTime.Now);

        return new Pagamento
        {
            Id = Id,
            BeneficiarioId = b.Id,
            BeneficiarioNome = b.Nome,
            BeneficiarioCpf = b.Cpf,
            ParcelaNumero = ParcelaNumero,
            Valor = Valor,
            Status = IsPago ? StatusParcela.Pago : StatusParcela.Previsto,
            DataPrevista = prevStr,
            DataPagamento = pagStr,
            FormaPgto = "PIX",
            ChavePix = !string.IsNullOrWhiteSpace(ChavePix) ? ChavePix : b.ChavePix,
            TipoChavePix = b.TipoChavePix,
            Banco = !string.IsNullOrWhiteSpace(Banco) ? Banco : b.Banco,
            SaldoAposParcela = Math.Max(0, b.SaldoDevedor - (IsPago ? Valor : 0)),
            Dia = dtForCalc.Day.ToString("00"),
            Mes = dtForCalc.ToString("MMMM", new System.Globalization.CultureInfo("pt-BR")),
            Ano = dtForCalc.Year.ToString(),
            CidadeUf = b.CidadeUf,
            Observacoes = Observacoes
        };
    }
}
