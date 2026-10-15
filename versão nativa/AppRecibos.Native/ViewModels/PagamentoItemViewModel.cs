using System;
using System.Globalization;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using CommunityToolkit.Mvvm.ComponentModel;

namespace AppRecibos.Native.ViewModels;

public partial class PagamentoItemViewModel : ObservableObject
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    public Pagamento Model { get; }

    [ObservableProperty]
    private bool _isSelected;

    [ObservableProperty]
    private int _batchSequenceIndex = 1;

    public Action<PagamentoItemViewModel>? SelectionChangedCallback { get; set; }
    public Action<PagamentoItemViewModel>? ToggleStatusCallback { get; set; }
    public Action<PagamentoItemViewModel>? OpenPreviewCallback { get; set; }
    public Action<PagamentoItemViewModel>? EditCallback { get; set; }
    public Action<PagamentoItemViewModel>? DeleteCallback { get; set; }

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void ToggleStatus() => ToggleStatusCallback?.Invoke(this);

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void OpenPreview() => OpenPreviewCallback?.Invoke(this);

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void Edit() => EditCallback?.Invoke(this);

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void Delete() => DeleteCallback?.Invoke(this);

    public PagamentoItemViewModel(Pagamento model, bool isSelected = false)
    {
        Model = model;
        _isSelected = isSelected;
    }

    partial void OnIsSelectedChanged(bool value)
    {
        SelectionChangedCallback?.Invoke(this);
    }

    public string Id => Model.Id;
    public string BeneficiarioId => Model.BeneficiarioId;
    public string BeneficiarioNome => Model.BeneficiarioNome;
    public string BeneficiarioCpf => Model.BeneficiarioCpf;
    public int ParcelaNumero => Model.ParcelaNumero;
    public decimal Valor => Model.Valor;
    public string ValorFormatado => Model.Valor.ToString("C2", PtBr);
    public decimal Saldo => Model.SaldoAposParcela;
    public string SaldoFormatado => Model.SaldoAposParcela.ToString("C2", PtBr);
    public StatusParcela Status => Model.Status;
    public bool IsPago => Model.Status == StatusParcela.Pago;
    public bool IsPrevisto => Model.Status == StatusParcela.Previsto;
    public string StatusFormatado => IsPago ? "PAGO" : "PREVISTO";

    public string FormaPgto => Model.FormaPgto;
    public string ChavePix => Model.ChavePix;
    public string Banco => Model.Banco;

    public string PrevisaoFormatada
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(Model.DataPrevista) && Model.DataPrevista.Contains('-'))
            {
                var parts = Model.DataPrevista.Split('-');
                if (parts.Length == 3) return $"{parts[2]}/{parts[1]}/{parts[0]}";
            }
            if (!string.IsNullOrWhiteSpace(Model.Dia) && !string.IsNullOrWhiteSpace(Model.Mes) && !string.IsNullOrWhiteSpace(Model.Ano))
            {
                var mesCurto = Model.Mes.Length > 3 ? Model.Mes.Substring(0, 3) : Model.Mes;
                return $"{Model.Dia.PadLeft(2, '0')}/{mesCurto}/{Model.Ano}";
            }
            return Model.DataPrevista ?? "-";
        }
    }

    public string PagamentoFormatado
    {
        get
        {
            if (IsPrevisto) return "-";
            if (!string.IsNullOrWhiteSpace(Model.DataPagamento) && Model.DataPagamento.Contains('-'))
            {
                var parts = Model.DataPagamento.Split('-');
                if (parts.Length == 3) return $"{parts[2]}/{parts[1]}/{parts[0]}";
            }
            if (!string.IsNullOrWhiteSpace(Model.Dia) && !string.IsNullOrWhiteSpace(Model.Mes) && !string.IsNullOrWhiteSpace(Model.Ano))
            {
                var mesCurto = Model.Mes.Length > 3 ? Model.Mes.Substring(0, 3) : Model.Mes;
                return $"{Model.Dia.PadLeft(2, '0')}/{mesCurto}/{Model.Ano}";
            }
            return Model.DataPagamento ?? "-";
        }
    }
}
