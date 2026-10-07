using AppRecibos.Core.Domain.Common;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Infrastructure.Data.Repositories;
using AppRecibos.Core.Infrastructure.Excel;

namespace AppRecibos.Core.Services;

public class SyncService
{
    private readonly ExcelSyncEngine _excelEngine;
    private readonly BeneficiarioRepository _beneficiarioRepo;
    private readonly PagamentoRepository _pagamentoRepo;

    public SyncService(
        ExcelSyncEngine excelEngine,
        BeneficiarioRepository beneficiarioRepo,
        PagamentoRepository pagamentoRepo)
    {
        _excelEngine = excelEngine;
        _beneficiarioRepo = beneficiarioRepo;
        _pagamentoRepo = pagamentoRepo;
    }

    public async Task<Result<(int BeneficiariosImportados, int PagamentosImportados)>> ImportarPlanilhaParaBancoAsync(string excelPath)
    {
        var readResult = await _excelEngine.LerPlanilhaAsync(excelPath);
        if (!readResult.IsSuccess)
            return Result<(int, int)>.Failure(readResult.Error ?? "Erro ao ler planilha.");

        var (beneficiarios, pagamentos) = readResult.Value;

        foreach (var ben in beneficiarios)
        {
            await _beneficiarioRepo.SaveAsync(ben);
        }

        foreach (var pag in pagamentos)
        {
            var ben = beneficiarios.FirstOrDefault(b => string.Equals(b.Nome, pag.BeneficiarioNome, StringComparison.OrdinalIgnoreCase));
            var pagFinal = ben != null ? pag with { BeneficiarioId = ben.Id } : pag;
            await _pagamentoRepo.SaveAsync(pagFinal);
        }

        return Result<(int, int)>.Success((beneficiarios.Count, pagamentos.Count));
    }

    public async Task<Result> SincronizarParcelaComPlanilhaAsync(string excelPath, string pagamentoId)
    {
        var pag = await _pagamentoRepo.GetByIdAsync(pagamentoId);
        if (pag == null)
            return Result.Failure($"Pagamento '{pagamentoId}' não encontrado no banco.");

        return await _excelEngine.AtualizarParcelaNaPlanilhaAsync(excelPath, pag);
    }
}
