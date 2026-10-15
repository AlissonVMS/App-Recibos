using System;
using System.Globalization;
using AppRecibos.Core.Domain.Entities;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AppRecibos.Native.ViewModels;

public sealed partial class ContractPartyViewModel : ObservableObject
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    public Beneficiario OriginalModel { get; }
    public string Id => OriginalModel.Id;

    [ObservableProperty]
    private int _index = 1;

    [ObservableProperty]
    private string _nome = string.Empty;

    [ObservableProperty]
    private string _cpf = string.Empty;

    [ObservableProperty]
    private decimal _contratoTotal;

    [ObservableProperty]
    private string _cidadeUf = string.Empty;

    [ObservableProperty]
    private string _banco = string.Empty;

    [ObservableProperty]
    private string _agencia = string.Empty;

    [ObservableProperty]
    private string _conta = string.Empty;

    [ObservableProperty]
    private string _operacao = string.Empty;

    [ObservableProperty]
    private string _tipoConta = "CORRENTE";

    [ObservableProperty]
    private string _tipoChavePix = "CPF";

    [ObservableProperty]
    private string _chavePix = string.Empty;

    [ObservableProperty]
    private bool _isExpanded = true;

    public string ContratoTotalFormatado => "R$ " + ContratoTotal.ToString("N2", PtBr);

    public ContractPartyViewModel(Beneficiario model, int index = 1)
    {
        OriginalModel = model;
        _index = index;
        _nome = model.Nome;
        _cpf = model.Cpf;
        _contratoTotal = model.ContratoTotal;
        _cidadeUf = model.CidadeUf;
        _banco = model.Banco;
        _agencia = model.Agencia ?? string.Empty;
        _conta = model.Conta ?? string.Empty;
        _operacao = model.Operacao ?? string.Empty;
        _tipoConta = model.TipoConta;
        _tipoChavePix = model.TipoChavePix ?? "CPF";
        _chavePix = model.ChavePix;
    }

    [RelayCommand]
    private void ToggleExpand()
    {
        IsExpanded = !IsExpanded;
    }

    public Beneficiario ToUpdatedBeneficiario()
    {
        return OriginalModel with
        {
            Nome = Nome,
            Cpf = Cpf,
            ContratoTotal = ContratoTotal,
            CidadeUf = CidadeUf,
            Banco = Banco,
            Agencia = Agencia,
            Conta = Conta,
            Operacao = Operacao,
            TipoConta = TipoConta,
            TipoChavePix = TipoChavePix,
            ChavePix = ChavePix
        };
    }
}
