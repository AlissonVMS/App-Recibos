using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Infrastructure.Data;
using AppRecibos.Core.Infrastructure.Data.Repositories;
using AppRecibos.Core.Services;
using FluentAssertions;
using Xunit;

namespace AppRecibos.Tests;

public class PaymentServiceTests
{
    private readonly SqliteDbConnectionFactory _factory;
    private readonly BeneficiarioRepository _beneficiarioRepo;
    private readonly PagamentoRepository _pagamentoRepo;
    private readonly PaymentService _paymentService;

    public PaymentServiceTests()
    {
        // Use unique file in /tmp for full sqlite persistence in test
        var dbPath = Path.Combine(Path.GetTempPath(), $"test_recibos_{Guid.NewGuid():N}.db");
        _factory = new SqliteDbConnectionFactory(dbPath);
        _factory.InitializeDatabase();

        _beneficiarioRepo = new BeneficiarioRepository(_factory);
        _pagamentoRepo = new PagamentoRepository(_factory);
        _paymentService = new PaymentService(_beneficiarioRepo, _pagamentoRepo);
    }

    [Fact]
    public async Task QuitarEReverterParcela_DeveRecalcularSaldosCorretamente()
    {
        // 1. Seed Beneficiario com Contrato de 30.000
        var ben = new Beneficiario
        {
            Id = "ben-test-1",
            Nome = "ELIANE MARIA DA SILVA",
            Cpf = "046.931.264-54",
            ContratoTotal = 30000m,
            TotalPago = 0m,
            SaldoDevedor = 30000m,
            Status = "EM ABERTO",
            Banco = "Caixa Econômica Federal",
            TipoConta = "POUPANÇA",
            ChavePix = "046.931.264-54",
            CidadeUf = "Maceió - AL"
        };
        await _beneficiarioRepo.SaveAsync(ben);

        // 2. Criar duas parcelas previstas: 10.000 e 5.000
        var p1 = new Pagamento
        {
            Id = "pg-1",
            BeneficiarioId = ben.Id,
            BeneficiarioNome = ben.Nome,
            BeneficiarioCpf = ben.Cpf,
            ParcelaNumero = 1,
            Valor = 10000m,
            Status = StatusParcela.Previsto,
            FormaPgto = "PIX",
            ChavePix = ben.ChavePix,
            Banco = ben.Banco,
            SaldoAposParcela = 30000m,
            CidadeUf = ben.CidadeUf
        };
        var p2 = new Pagamento
        {
            Id = "pg-2",
            BeneficiarioId = ben.Id,
            BeneficiarioNome = ben.Nome,
            BeneficiarioCpf = ben.Cpf,
            ParcelaNumero = 2,
            Valor = 5000m,
            Status = StatusParcela.Previsto,
            FormaPgto = "PIX",
            ChavePix = ben.ChavePix,
            Banco = ben.Banco,
            SaldoAposParcela = 30000m,
            CidadeUf = ben.CidadeUf
        };
        await _pagamentoRepo.SaveAsync(p1);
        await _pagamentoRepo.SaveAsync(p2);

        // 3. Quitar Parcela 1
        var quitou = await _paymentService.QuitarParcelaAsync("pg-1", "2025-08-25");
        quitou.IsSuccess.Should().BeTrue();

        var benAposP1 = await _beneficiarioRepo.GetByIdAsync(ben.Id);
        benAposP1.Should().NotBeNull();
        benAposP1!.TotalPago.Should().Be(10000m);
        benAposP1.SaldoDevedor.Should().Be(20000m);
        benAposP1.Status.Should().Be("EM ABERTO");

        var p1Apos = await _pagamentoRepo.GetByIdAsync("pg-1");
        p1Apos!.Status.Should().Be(StatusParcela.Pago);
        p1Apos.DataPagamento.Should().Be("2025-08-25");
        p1Apos.SaldoAposParcela.Should().Be(20000m);

        // 4. Quitar Parcela 2
        await _paymentService.QuitarParcelaAsync("pg-2", "2025-10-07");
        var benAposP2 = await _beneficiarioRepo.GetByIdAsync(ben.Id);
        benAposP2!.TotalPago.Should().Be(15000m);
        benAposP2.SaldoDevedor.Should().Be(15000m);

        // 5. Reverter Parcela 1
        var reverteu = await _paymentService.ReverterParcelaAsync("pg-1");
        reverteu.IsSuccess.Should().BeTrue();

        var benAposReversao = await _beneficiarioRepo.GetByIdAsync(ben.Id);
        // Apenas p2 (5000) permanece paga
        benAposReversao!.TotalPago.Should().Be(5000m);
        benAposReversao.SaldoDevedor.Should().Be(25000m);

        var p1Revertida = await _pagamentoRepo.GetByIdAsync("pg-1");
        p1Revertida!.Status.Should().Be(StatusParcela.Previsto);
        p1Revertida.DataPagamento.Should().BeNull();
    }

    [Fact]
    public async Task DeveQuitarEReverterParcelasEmLoteCorretamente()
    {
        var ben = new Beneficiario
        {
            Id = "ben-batch",
            Nome = "BENEFICIARIO LOTE",
            Cpf = "111.222.333-44",
            ContratoTotal = 50000m,
            TotalPago = 0m,
            SaldoDevedor = 50000m,
            Status = "EM ABERTO",
            Banco = "Caixa Econômica Federal",
            TipoConta = "POUPANÇA",
            ChavePix = "111.222.333-44",
            CidadeUf = "Maceió - AL"
        };
        await _beneficiarioRepo.SaveAsync(ben);

        var p1 = new Pagamento
        {
            Id = "pg-lote-1",
            BeneficiarioId = ben.Id,
            BeneficiarioNome = ben.Nome,
            BeneficiarioCpf = ben.Cpf,
            ParcelaNumero = 1,
            Valor = 10000m,
            Status = StatusParcela.Previsto,
            DataPrevista = "2025-08-25",
            FormaPgto = "PIX",
            ChavePix = ben.ChavePix,
            Banco = ben.Banco,
            SaldoAposParcela = 50000m,
            CidadeUf = ben.CidadeUf
        };
        var p2 = new Pagamento
        {
            Id = "pg-lote-2",
            BeneficiarioId = ben.Id,
            BeneficiarioNome = ben.Nome,
            BeneficiarioCpf = ben.Cpf,
            ParcelaNumero = 2,
            Valor = 15000m,
            Status = StatusParcela.Previsto,
            DataPrevista = "2025-09-25",
            FormaPgto = "PIX",
            ChavePix = ben.ChavePix,
            Banco = ben.Banco,
            SaldoAposParcela = 50000m,
            CidadeUf = ben.CidadeUf
        };
        await _pagamentoRepo.SaveAsync(p1);
        await _pagamentoRepo.SaveAsync(p2);

        // 1. Quitar em Lote
        var resQuitar = await _paymentService.QuitarParcelasLoteAsync(new[] { "pg-lote-1", "pg-lote-2" }, "2025-09-30");
        resQuitar.IsSuccess.Should().BeTrue();

        var benAposQuitar = await _beneficiarioRepo.GetByIdAsync(ben.Id);
        benAposQuitar!.TotalPago.Should().Be(25000m);
        benAposQuitar.SaldoDevedor.Should().Be(25000m);

        var p1Salva = await _pagamentoRepo.GetByIdAsync("pg-lote-1");
        p1Salva!.Status.Should().Be(StatusParcela.Pago);
        var p2Salva = await _pagamentoRepo.GetByIdAsync("pg-lote-2");
        p2Salva!.Status.Should().Be(StatusParcela.Pago);

        // 2. Reverter em Lote para Previsto
        var resReverter = await _paymentService.ReverterParcelasLoteAsync(new[] { "pg-lote-1", "pg-lote-2" });
        resReverter.IsSuccess.Should().BeTrue();

        var benAposReverter = await _beneficiarioRepo.GetByIdAsync(ben.Id);
        benAposReverter!.TotalPago.Should().Be(0m);
        benAposReverter.SaldoDevedor.Should().Be(50000m);

        var p1Rev = await _pagamentoRepo.GetByIdAsync("pg-lote-1");
        p1Rev!.Status.Should().Be(StatusParcela.Previsto);
        p1Rev.DataPagamento.Should().BeNull();
        var p2Rev = await _pagamentoRepo.GetByIdAsync("pg-lote-2");
        p2Rev!.Status.Should().Be(StatusParcela.Previsto);
        p2Rev.DataPagamento.Should().BeNull();
    }
}
