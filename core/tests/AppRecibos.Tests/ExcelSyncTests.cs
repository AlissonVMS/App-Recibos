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

            // 3. Atualizar Parcela 15 de ELIANE para PAGO (pois 1 a 14 já estão quitadas)
            var parcela15Eliane = pagamentos.First(p => p.BeneficiarioNome == "ELIANE MARIA DA SILVA" && p.ParcelaNumero == 15);
            parcela15Eliane.Status.Should().Be(StatusParcela.Previsto);
            parcela15Eliane.DataPagamento.Should().BeNull();
            parcela15Eliane.DataPrevista.Should().Be("2026-11-10");

            var parcela15Quitada = parcela15Eliane with
            {
                Status = StatusParcela.Pago,
                Valor = 1000m,
                DataPagamento = "2026-11-10"
            };

            var updateResult = await _engine.AtualizarParcelaNaPlanilhaAsync(tempFile, parcela15Quitada);
            updateResult.IsSuccess.Should().BeTrue();

            // 4. Re-ler e verificar persistência na planilha
            var reReadResult = await _engine.LerPlanilhaAsync(tempFile);
            if (!reReadResult.IsSuccess)
            {
                throw new Exception("Re-read error: " + reReadResult.Error);
            }
            reReadResult.IsSuccess.Should().BeTrue();
            var rePagamentos = reReadResult.Value.Pagamentos;

            var conferida = rePagamentos.First(p => p.BeneficiarioNome == "ELIANE MARIA DA SILVA" && p.ParcelaNumero == 15);
            conferida.Status.Should().Be(StatusParcela.Pago);
            conferida.Valor.Should().Be(1000m);
            conferida.DataPagamento.Should().Be("2026-11-10");

            // 5. Reverter para PREVISTO
            var parcela15Revertida = conferida with
            {
                Status = StatusParcela.Previsto,
                DataPagamento = null
            };
            var revertResult = await _engine.AtualizarParcelaNaPlanilhaAsync(tempFile, parcela15Revertida);
            revertResult.IsSuccess.Should().BeTrue();

            // 6. Conferir que reverteu para PREVISTO
            var checkRevert = await _engine.LerPlanilhaAsync(tempFile);
            checkRevert.IsSuccess.Should().BeTrue();
            var parcelaRevertidaLida = checkRevert.Value.Pagamentos.First(p => p.BeneficiarioNome == "ELIANE MARIA DA SILVA" && p.ParcelaNumero == 15);
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

            var pagos = pags.Count(p => p.Status == StatusParcela.Pago);
            var previstos = pags.Count(p => p.Status == StatusParcela.Previsto);
            pagos.Should().Be(42);
            previstos.Should().Be(12);

            // Nenhuma parcela pode ter mes numérico ou 30000
            pags.Should().OnlyContain(p => !string.IsNullOrEmpty(p.Mes) && !char.IsDigit(p.Mes[0]));
        }
        finally
        {
            if (File.Exists(dbPath))
                File.Delete(dbPath);
        }
    }

    [Fact]
    public async Task LerPlanilhaRealOneDrive_DeveCarregarComSucesso()
    {
        var realPath = "/home/alisson/Documentos/OneDrive/Documentos/##docs herança irmãos/CONTROLE PAGAMENTOS.xlsx";
        if (!File.Exists(realPath)) return;

        var result = await _engine.LerPlanilhaAsync(realPath);
        result.IsSuccess.Should().BeTrue();
        var (beneficiarios, pagamentos) = result.Value;
        beneficiarios.Should().HaveCount(3);
        pagamentos.Should().HaveCount(54);

        var pagos = pagamentos.Count(p => p.Status == StatusParcela.Pago);
        var previstos = pagamentos.Count(p => p.Status == StatusParcela.Previsto);
        (pagos + previstos).Should().Be(54);
        pagos.Should().BeGreaterThanOrEqualTo(36);

        // Verificar que parcelas 15 a 18 são previstas com dia 10 e sem data de pagamento
        var parcelasPrevistas = pagamentos.Where(p => p.ParcelaNumero >= 15).ToList();
        parcelasPrevistas.Should().OnlyContain(p => p.Status == StatusParcela.Previsto && p.DataPagamento == null);
        parcelasPrevistas.Should().OnlyContain(p => p.DataPrevista != null && p.DataPrevista.EndsWith("-10"));

        // Verificar que mes nunca é numérico (ex: "30000")
        pagamentos.Should().OnlyContain(p => !string.IsNullOrEmpty(p.Mes) && !char.IsDigit(p.Mes[0]));
    }

    [Fact]
    public async Task SincronizarBancoRealDoUsuarioSeExistir()
    {
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "app-recibos",
            "recibos.db"
        );
        if (!File.Exists(dbPath)) return;

        var realExcel = "/home/alisson/Documentos/OneDrive/Documentos/##docs herança irmãos/CONTROLE PAGAMENTOS.xlsx";
        if (!File.Exists(realExcel)) return;

        var factory = new AppRecibos.Core.Infrastructure.Data.SqliteDbConnectionFactory(dbPath);
        factory.InitializeDatabase();
        var benRepo = new AppRecibos.Core.Infrastructure.Data.Repositories.BeneficiarioRepository(factory);
        var pagRepo = new AppRecibos.Core.Infrastructure.Data.Repositories.PagamentoRepository(factory);
        var syncService = new AppRecibos.Core.Services.SyncService(_engine, benRepo, pagRepo);

        var res = await syncService.ImportarPlanilhaParaBancoAsync(realExcel);
        res.IsSuccess.Should().BeTrue();
        res.Value.BeneficiariosImportados.Should().Be(3);
        res.Value.PagamentosImportados.Should().Be(54);

        var pags = await pagRepo.GetAllAsync();
        var pagos = pags.Count(p => p.Status == StatusParcela.Pago);
        var previstos = pags.Count(p => p.Status == StatusParcela.Previsto);
        (pagos + previstos).Should().Be(54);
        pagos.Should().BeGreaterThanOrEqualTo(36);

        // Nenhuma parcela no banco pode ter mes numérico ou resíduo
        pags.Should().OnlyContain(p => !string.IsNullOrEmpty(p.Mes) && !char.IsDigit(p.Mes[0]));
    }
}
