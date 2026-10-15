using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using CommunityToolkit.Mvvm.ComponentModel;

namespace AppRecibos.Native.ViewModels;

public sealed partial class BeneficiarioCardViewModel : ObservableObject
{
    private static readonly CultureInfo Culture = new("pt-BR");

    public Beneficiario Beneficiario { get; }

    public string Nome => Beneficiario.Nome;
    public string Cpf => Beneficiario.Cpf;
    public string CidadeUf => Beneficiario.CidadeUf;

    public decimal ContratoTotal => Beneficiario.ContratoTotal;
    public string ContratoTotalFormatado => "R$ " + ContratoTotal.ToString("N2", Culture);

    public decimal TotalPago { get; }
    public string TotalPagoFormatado => "R$ " + TotalPago.ToString("N2", Culture);

    public decimal SaldoDevedor { get; }
    public string SaldoDevedorFormatado => "R$ " + SaldoDevedor.ToString("N2", Culture);

    public double PagoPercentual { get; }

    public string Status => SaldoDevedor == 0 ? "QUITADO" : "EM ABERTO";
    public bool IsQuitado => SaldoDevedor == 0;

    public string Banco => Beneficiario.Banco;
    public string Agencia => !string.IsNullOrWhiteSpace(Beneficiario.Agencia) ? Beneficiario.Agencia : "-";
    public string Conta => !string.IsNullOrWhiteSpace(Beneficiario.Conta) ? Beneficiario.Conta : "-";
    public string AgenciaContaText => $"Ag: {Agencia} • Conta: {Conta}";
    public string TipoConta => Beneficiario.TipoConta;
    public string TipoChavePix => !string.IsNullOrWhiteSpace(Beneficiario.TipoChavePix) ? Beneficiario.TipoChavePix : "CPF";
    public string ChavePix => Beneficiario.ChavePix;

    public Pagamento? LastPayment { get; }
    public bool HasLastPayment => LastPayment != null;
    public string LastPaymentText => LastPayment != null 
        ? $"{FormatDataParcela(LastPayment)} (nº {LastPayment.ParcelaNumero})" 
        : "Nenhum pagamento";
    public string LastPaymentValorFormatado => LastPayment != null ? "R$ " + LastPayment.Valor.ToString("N2", Culture) : "-";

    public Pagamento? NextPlannedPayment { get; }
    public bool HasNextPlannedPayment => NextPlannedPayment != null;
    public string NextPlannedText => NextPlannedPayment != null 
        ? $"Próxima Prevista: nº {NextPlannedPayment.ParcelaNumero} ({FormatMesDiaCurto(NextPlannedPayment)})" 
        : "-";
    public string NextPlannedValorFormatado => NextPlannedPayment != null ? "R$ " + NextPlannedPayment.Valor.ToString("N2", Culture) : "-";

    public int PaidPaymentsCount { get; }
    public string PaidPaymentsCountText => $"{PaidPaymentsCount} parcelas pagas";

    public Action<Beneficiario>? OpenEditCallback { get; set; }
    public Action<string>? NavigateToPaymentsCallback { get; set; }
    public Action<string>? CopyPixCallback { get; set; }

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void Edit() => OpenEditCallback?.Invoke(Beneficiario);

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void NavigateToPayments() => NavigateToPaymentsCallback?.Invoke(Nome);

    [CommunityToolkit.Mvvm.Input.RelayCommand]
    private void CopyPix() => CopyPixCallback?.Invoke(ChavePix);

    public BeneficiarioCardViewModel(Beneficiario b, IEnumerable<Pagamento> allPayments)
    {
        Beneficiario = b;

        var benPayments = allPayments
            .Where(p => string.Equals(p.BeneficiarioNome, b.Nome, StringComparison.OrdinalIgnoreCase) || 
                         string.Equals(p.BeneficiarioId, b.Id, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var paidPayments = benPayments
            .Where(p => p.Status == StatusParcela.Pago)
            .OrderBy(p => p.ParcelaNumero)
            .ToList();

        var plannedPayments = benPayments
            .Where(p => p.Status == StatusParcela.Previsto)
            .OrderBy(p => p.ParcelaNumero)
            .ToList();

        TotalPago = paidPayments.Sum(p => p.Valor);
        SaldoDevedor = Math.Max(0, b.ContratoTotal - TotalPago);
        PagoPercentual = b.ContratoTotal > 0 ? (double)(TotalPago / b.ContratoTotal) * 100.0 : 0.0;

        PaidPaymentsCount = paidPayments.Count;
        LastPayment = paidPayments.LastOrDefault();
        NextPlannedPayment = plannedPayments.FirstOrDefault();
    }

    private static string FormatDataParcela(Pagamento? p)
    {
        if (p == null) return "-";
        if (!string.IsNullOrEmpty(p.Dia) && !string.IsNullOrEmpty(p.Mes) && !string.IsNullOrEmpty(p.Ano) && !int.TryParse(p.Mes, out _))
        {
            string mesCurto = p.Mes.Length > 3 ? p.Mes.Substring(0, 3) : p.Mes;
            mesCurto = char.ToUpper(mesCurto[0]) + mesCurto.Substring(1).ToLower();
            return $"{p.Dia} {mesCurto} {p.Ano}";
        }
        string? dateStr = p.DataPagamento ?? p.DataPrevista;
        if (!string.IsNullOrEmpty(dateStr) && dateStr.Contains('-'))
        {
            var parts = dateStr.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[1], out int m) && m >= 1 && m <= 12)
            {
                var dt = new DateTime(int.Parse(parts[0]), m, int.Parse(parts[2]));
                string mes = dt.ToString("MMM", Culture);
                mes = char.ToUpper(mes[0]) + mes.Substring(1);
                return $"{parts[2]} {mes} {parts[0]}";
            }
            if (parts.Length == 3) return $"{parts[2]}/{parts[1]}/{parts[0]}";
        }
        return !string.IsNullOrEmpty(p.Data) ? p.Data : "-";
    }

    private static string FormatMesDiaCurto(Pagamento? p)
    {
        if (p == null) return "-";
        if (!string.IsNullOrEmpty(p.Dia) && !string.IsNullOrEmpty(p.Mes) && !int.TryParse(p.Mes, out _))
        {
            string mesCurto = p.Mes.Length > 3 ? p.Mes.Substring(0, 3) : p.Mes;
            mesCurto = char.ToUpper(mesCurto[0]) + mesCurto.Substring(1).ToLower();
            return $"{p.Dia}/{mesCurto}";
        }
        string? dateStr = p.DataPrevista ?? p.DataPagamento;
        if (!string.IsNullOrEmpty(dateStr) && dateStr.Contains('-'))
        {
            var parts = dateStr.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[1], out int m) && m >= 1 && m <= 12)
            {
                var dt = new DateTime(int.Parse(parts[0]), m, int.Parse(parts[2]));
                string mes = dt.ToString("MMM", Culture);
                mes = char.ToUpper(mes[0]) + mes.Substring(1);
                return $"{parts[2]}/{mes}";
            }
            if (parts.Length == 3) return $"{parts[2]}/{parts[1]}";
        }
        return "-";
    }
}
