using System;
using System.Collections.ObjectModel;
using System.Globalization;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AppRecibos.Native.ViewModels;

public partial class BeneficiaryDialogViewModel : ViewModelBase
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    public Beneficiario BeneficiarioOriginal { get; }

    [ObservableProperty]
    private string _nome = string.Empty;

    [ObservableProperty]
    private string _cpf = string.Empty;

    [ObservableProperty]
    private string _contratoTotalFormatado = "R$ 0,00";

    [ObservableProperty]
    private string _totalPagoFormatado = "R$ 0,00";

    [ObservableProperty]
    private string _saldoDevedorFormatado = "R$ 0,00";

    [ObservableProperty]
    private string _status = "EM ABERTO";

    [ObservableProperty]
    private bool _isQuitado;

    [ObservableProperty]
    private string _cidadeUf = string.Empty;

    [ObservableProperty]
    private string _banco = string.Empty;

    [ObservableProperty]
    private string _agencia = string.Empty;

    [ObservableProperty]
    private string _conta = string.Empty;

    [ObservableProperty]
    private string _tipoConta = "CORRENTE";

    [ObservableProperty]
    private ObservableCollection<string> _tipoContaOptions = new() { "POUPANÇA", "CORRENTE" };

    [ObservableProperty]
    private string _tipoChavePix = "CPF";

    [ObservableProperty]
    private ObservableCollection<string> _tipoChavePixOptions = new() { "CPF", "CNPJ", "TELEFONE", "E-MAIL", "ALEATÓRIA" };

    [ObservableProperty]
    private string _chavePix = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public bool IsConfirmed { get; private set; }

    public event Action? RequestClose;

    public BeneficiaryDialogViewModel(Beneficiario b, ContratoConfig? config = null)
    {
        BeneficiarioOriginal = b;

        Nome = b.Nome;
        Cpf = b.Cpf;
        ContratoTotalFormatado = b.ContratoTotal.ToString("C", PtBr);
        TotalPagoFormatado = b.TotalPago.ToString("C", PtBr);
        SaldoDevedorFormatado = b.SaldoDevedor.ToString("C", PtBr);
        Status = b.Status ?? (b.SaldoDevedor <= 0 ? "QUITADO" : "EM ABERTO");
        IsQuitado = Status == "QUITADO";

        CidadeUf = b.CidadeUf ?? string.Empty;
        Banco = b.Banco ?? string.Empty;
        Agencia = b.Agencia ?? string.Empty;
        Conta = b.Conta ?? string.Empty;
        TipoConta = string.IsNullOrWhiteSpace(b.TipoConta) ? "CORRENTE" : b.TipoConta.ToUpperInvariant();
        TipoChavePix = string.IsNullOrWhiteSpace(b.TipoChavePix) ? "CPF" : b.TipoChavePix.ToUpperInvariant();
        ChavePix = b.ChavePix ?? string.Empty;
    }

    [RelayCommand]
    private void Save()
    {
        if (string.IsNullOrWhiteSpace(CidadeUf))
        {
            ErrorMessage = "Informe a Cidade / UF.";
            return;
        }

        if (string.IsNullOrWhiteSpace(Banco))
        {
            ErrorMessage = "Informe a instituição financeira (banco).";
            return;
        }

        if (string.IsNullOrWhiteSpace(ChavePix))
        {
            ErrorMessage = "Informe a Chave PIX.";
            return;
        }

        ErrorMessage = string.Empty;
        IsConfirmed = true;
        RequestClose?.Invoke();
    }

    [RelayCommand]
    private void Cancel()
    {
        IsConfirmed = false;
        RequestClose?.Invoke();
    }

    public Beneficiario ToUpdatedBeneficiario()
    {
        return BeneficiarioOriginal with
        {
            CidadeUf = CidadeUf.Trim(),
            Banco = Banco.Trim(),
            Agencia = Agencia.Trim(),
            Conta = Conta.Trim(),
            TipoConta = TipoConta,
            TipoChavePix = TipoChavePix,
            ChavePix = ChavePix.Trim()
        };
    }
}
