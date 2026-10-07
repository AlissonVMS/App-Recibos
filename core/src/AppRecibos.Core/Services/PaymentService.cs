using System.Globalization;
using AppRecibos.Core.Domain.Common;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Infrastructure.Data.Repositories;

namespace AppRecibos.Core.Services;

public class PaymentService
{
    private readonly BeneficiarioRepository _beneficiarioRepo;
    private readonly PagamentoRepository _pagamentoRepo;

    public PaymentService(BeneficiarioRepository beneficiarioRepo, PagamentoRepository pagamentoRepo)
    {
        _beneficiarioRepo = beneficiarioRepo;
        _pagamentoRepo = pagamentoRepo;
    }

    public async Task<Result> QuitarParcelaAsync(string pagamentoId, string? dataPagamento = null)
    {
        var pagamento = await _pagamentoRepo.GetByIdAsync(pagamentoId);
        if (pagamento == null)
            return Result.Failure($"Pagamento com ID '{pagamentoId}' não encontrado.");

        var dataEfetiva = string.IsNullOrWhiteSpace(dataPagamento)
            ? DateTime.Now.ToString("yyyy-MM-dd")
            : dataPagamento;

        DateTime dt;
        if (!DateTime.TryParseExact(dataEfetiva, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
        {
            dt = DateTime.Now;
        }

        var ptBr = new CultureInfo("pt-BR");
        var atualizado = pagamento with
        {
            Status = StatusParcela.Pago,
            DataPagamento = dataEfetiva,
            Dia = dt.Day.ToString("00"),
            Mes = dt.ToString("MMMM", ptBr),
            Ano = dt.Year.ToString()
        };

        await _pagamentoRepo.SaveAsync(atualizado);
        await RecalcularSaldosAsync(pagamento.BeneficiarioId);

        return Result.Success();
    }

    public async Task<Result> ReverterParcelaAsync(string pagamentoId)
    {
        var pagamento = await _pagamentoRepo.GetByIdAsync(pagamentoId);
        if (pagamento == null)
            return Result.Failure($"Pagamento com ID '{pagamentoId}' não encontrado.");

        var revertido = pagamento with
        {
            Status = StatusParcela.Previsto,
            DataPagamento = null,
            Dia = null,
            Mes = null,
            Ano = null
        };

        await _pagamentoRepo.SaveAsync(revertido);
        await RecalcularSaldosAsync(pagamento.BeneficiarioId);

        return Result.Success();
    }

    public async Task<Result> QuitarParcelasLoteAsync(IEnumerable<string> ids, string? dataPagamento = null)
    {
        var beneficiariosAfetados = new HashSet<string>();
        foreach (var id in ids)
        {
            var p = await _pagamentoRepo.GetByIdAsync(id);
            if (p == null) continue;

            var dataEfetiva = string.IsNullOrWhiteSpace(dataPagamento)
                ? DateTime.Now.ToString("yyyy-MM-dd")
                : dataPagamento;

            DateTime dt;
            if (!DateTime.TryParseExact(dataEfetiva, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            {
                dt = DateTime.Now;
            }

            var ptBr = new CultureInfo("pt-BR");
            var atualizado = p with
            {
                Status = StatusParcela.Pago,
                DataPagamento = dataEfetiva,
                Dia = dt.Day.ToString("00"),
                Mes = dt.ToString("MMMM", ptBr),
                Ano = dt.Year.ToString()
            };

            await _pagamentoRepo.SaveAsync(atualizado);
            beneficiariosAfetados.Add(p.BeneficiarioId);
        }

        foreach (var benId in beneficiariosAfetados)
        {
            await RecalcularSaldosAsync(benId);
        }

        return Result.Success();
    }

    public async Task<Result> ReverterParcelasLoteAsync(IEnumerable<string> ids)
    {
        var beneficiariosAfetados = new HashSet<string>();
        foreach (var id in ids)
        {
            var p = await _pagamentoRepo.GetByIdAsync(id);
            if (p == null) continue;

            var revertido = p with
            {
                Status = StatusParcela.Previsto,
                DataPagamento = null,
                Dia = null,
                Mes = null,
                Ano = null
            };

            await _pagamentoRepo.SaveAsync(revertido);
            beneficiariosAfetados.Add(p.BeneficiarioId);
        }

        foreach (var benId in beneficiariosAfetados)
        {
            await RecalcularSaldosAsync(benId);
        }

        return Result.Success();
    }

    public async Task RecalcularSaldosAsync(string beneficiarioId)
    {
        var beneficiario = await _beneficiarioRepo.GetByIdAsync(beneficiarioId);
        if (beneficiario == null) return;

        var todosPagamentos = await _pagamentoRepo.GetAllAsync();
        var doBeneficiario = todosPagamentos
            .Where(p => p.BeneficiarioId == beneficiarioId)
            .OrderBy(p => p.ParcelaNumero)
            .ToList();

        decimal acumuladoPago = 0;
        foreach (var p in doBeneficiario)
        {
            if (p.Status == StatusParcela.Pago)
            {
                acumuladoPago += p.Valor;
            }
            var saldoRestante = beneficiario.ContratoTotal - acumuladoPago;
            if (p.SaldoAposParcela != saldoRestante)
            {
                var pAtualizado = p with { SaldoAposParcela = saldoRestante };
                await _pagamentoRepo.SaveAsync(pAtualizado);
            }
        }

        var saldoFinal = beneficiario.ContratoTotal - acumuladoPago;
        var status = saldoFinal <= 0 ? "QUITADO" : "EM ABERTO";

        await _beneficiarioRepo.UpdateSaldoAsync(beneficiarioId, acumuladoPago, saldoFinal, status);
    }
}
