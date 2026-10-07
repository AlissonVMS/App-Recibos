using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Infrastructure.Excel;
using FluentAssertions;
using Xunit;

namespace AppRecibos.Tests;

public class ExcelSyncTests
{
    private readonly ExcelSyncEngine _engine = new();

    private static string FindExcelPath()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current != null)
        {
            var candidate = Path.Combine(current.FullName, "CONTROLE PAGAMENTOS.xlsx");
            if (File.Exists(candidate))
                return candidate;
            current = current.Parent;
        }
        throw new FileNotFoundException("CONTROLE PAGAMENTOS.xlsx não encontrado nos diretórios pais.");
    }

    [Fact]
    public async Task LerEAtualizarPlanilha_DeveManterConsistenciaTotal()
    {
        var basePath = FindExcelPath();
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_sync_{Guid.NewGuid():N}.xlsx");
        File.Copy(basePath, tempFile, true);

        try
        {
            // 2. Ler planilha
            var readResult = await _engine.LerPlanilhaAsync(tempFile);
            readResult.IsSuccess.Should().BeTrue();
            var (beneficiarios, pagamentos) = readResult.Value;

            beneficiarios.Should().HaveCount(3);
            pagamentos.Should().HaveCount(54);

            // 3. Atualizar Parcela 14 de ELIANE para PAGO
            var parcela14Eliane = pagamentos.First(p => p.BeneficiarioNome == "ELIANE MARIA DA SILVA" && p.ParcelaNumero == 14);
            parcela14Eliane.Status.Should().Be(StatusParcela.Previsto);

            var parcela14Quitada = parcela14Eliane with
            {
                Status = StatusParcela.Pago,
                Valor = 1000m,
                DataPagamento = "2026-10-10"
            };

            var updateResult = await _engine.AtualizarParcelaNaPlanilhaAsync(tempFile, parcela14Quitada);
            updateResult.IsSuccess.Should().BeTrue();

            // 4. Re-ler e verificar persistência na planilha
            var reReadResult = await _engine.LerPlanilhaAsync(tempFile);
            if (!reReadResult.IsSuccess)
            {
                throw new Exception("Re-read error: " + reReadResult.Error);
            }
            reReadResult.IsSuccess.Should().BeTrue();
            var rePagamentos = reReadResult.Value.Pagamentos;

            var conferida = rePagamentos.First(p => p.BeneficiarioNome == "ELIANE MARIA DA SILVA" && p.ParcelaNumero == 14);
            conferida.Status.Should().Be(StatusParcela.Pago);
            conferida.Valor.Should().Be(1000m);
            conferida.DataPagamento.Should().Be("2026-10-10");

            // 5. Reverter para PREVISTO
            var parcela14Revertida = conferida with
            {
                Status = StatusParcela.Previsto,
                DataPagamento = null
            };
            var revertResult = await _engine.AtualizarParcelaNaPlanilhaAsync(tempFile, parcela14Revertida);
            revertResult.IsSuccess.Should().BeTrue();

            // 6. Conferir que reverteu para PREVISTO
            var checkRevert = await _engine.LerPlanilhaAsync(tempFile);
            checkRevert.IsSuccess.Should().BeTrue();
            var parcelaRevertidaLida = checkRevert.Value.Pagamentos.First(p => p.BeneficiarioNome == "ELIANE MARIA DA SILVA" && p.ParcelaNumero == 14);
            parcelaRevertidaLida.Status.Should().Be(StatusParcela.Previsto);
            parcelaRevertidaLida.DataPagamento.Should().BeNull();
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    [Fact]
    public async Task SyncService_ImportarPlanilhaParaBanco_DevePersistirComSucesso()
    {
        var basePath = FindExcelPath();
        var dbPath = Path.Combine(Path.GetTempPath(), $"test_db_{Guid.NewGuid():N}.db");
        var connectionFactory = new AppRecibos.Core.Infrastructure.Data.SqliteDbConnectionFactory(dbPath);
        var benRepo = new AppRecibos.Core.Infrastructure.Data.Repositories.BeneficiarioRepository(connectionFactory);
        var pagRepo = new AppRecibos.Core.Infrastructure.Data.Repositories.PagamentoRepository(connectionFactory);
        var syncService = new AppRecibos.Core.Services.SyncService(_engine, benRepo, pagRepo);

        try
        {
            connectionFactory.InitializeDatabase();

            var importResult = await syncService.ImportarPlanilhaParaBancoAsync(basePath);
            importResult.IsSuccess.Should().BeTrue();
            importResult.Value.BeneficiariosImportados.Should().Be(3);
            importResult.Value.PagamentosImportados.Should().Be(54);

            var bens = await benRepo.GetAllAsync();
            bens.Should().HaveCount(3);

            var pags = await pagRepo.GetAllAsync();
            pags.Should().HaveCount(54);
        }
        finally
        {
            if (File.Exists(dbPath))
                File.Delete(dbPath);
        }
    }
}
