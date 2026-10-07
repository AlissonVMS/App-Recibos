using System.Text.Json;
using System.Text.Json.Serialization;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Infrastructure.Data;
using AppRecibos.Core.Infrastructure.Data.Repositories;
using AppRecibos.Core.Infrastructure.Excel;
using AppRecibos.Core.Services;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Porta padrão 5000
builder.WebHost.UseUrls("http://127.0.0.1:5000");

// Configuração JSON com camelCase e enum como string
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// CORS permissivo para dev e desktop
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Localização segura de caminhos
string FindFile(string filename)
{
    var current = new DirectoryInfo(AppContext.BaseDirectory);
    while (current != null)
    {
        var candidate = Path.Combine(current.FullName, filename);
        if (File.Exists(candidate))
            return candidate;
        current = current.Parent;
    }
    return Path.Combine(AppContext.BaseDirectory, filename);
}

var dbPath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "app-recibos",
    "recibos.db"
);

// Injeção de dependências
builder.Services.AddSingleton(new SqliteDbConnectionFactory(dbPath));
builder.Services.AddSingleton<ContratoRepository>();
builder.Services.AddSingleton<BeneficiarioRepository>();
builder.Services.AddSingleton<PagamentoRepository>();
builder.Services.AddSingleton<BacenRepository>();
builder.Services.AddSingleton<ExcelSyncEngine>();
builder.Services.AddSingleton<PaymentService>();
builder.Services.AddSingleton<SyncService>();
builder.Services.AddSingleton<QuestPdfReceiptGenerator>();

var app = builder.Build();

app.UseCors();

// Suporte a arquivos estáticos do frontend (interface/dist ou wwwroot)
string FindDistDirectory()
{
    var candidates = new[]
    {
        Path.Combine(AppContext.BaseDirectory, "wwwroot"),
        Path.Combine(AppContext.BaseDirectory, "dist"),
        Path.Combine(AppContext.BaseDirectory, "interface", "dist"),
        Path.Combine(Directory.GetCurrentDirectory(), "interface", "dist")
    };
    foreach (var dir in candidates)
    {
        if (Directory.Exists(dir) && File.Exists(Path.Combine(dir, "index.html")))
            return dir;
    }
    var current = new DirectoryInfo(AppContext.BaseDirectory);
    while (current != null)
    {
        var test = Path.Combine(current.FullName, "interface", "dist");
        if (Directory.Exists(test) && File.Exists(Path.Combine(test, "index.html")))
            return test;
        current = current.Parent;
    }
    return string.Empty;
}

var distDir = FindDistDirectory();
if (!string.IsNullOrEmpty(distDir))
{
    var fileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(distDir);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });
}

// Inicialização e Seed do Banco de Dados
var connectionFactory = app.Services.GetRequiredService<SqliteDbConnectionFactory>();
connectionFactory.InitializeDatabase();

var contratoRepo = app.Services.GetRequiredService<ContratoRepository>();
var benRepo = app.Services.GetRequiredService<BeneficiarioRepository>();
var pagRepo = app.Services.GetRequiredService<PagamentoRepository>();
var syncService = app.Services.GetRequiredService<SyncService>();
var bacenRepo = app.Services.GetRequiredService<BacenRepository>();

// Seed inicial se o banco estiver vazio
var excelPath = FindFile("CONTROLE PAGAMENTOS.xlsx");
var existingContrato = await contratoRepo.GetAsync();
if (existingContrato == null)
{
    await contratoRepo.SaveAsync(new ContratoConfig
    {
        PagadorNome = "ABIGAIL PAULINO DA SILVA",
        PagadorCpf = "450.519.504-00",
        PagadorBanco = "104 - Caixa Econômica Federal",
        TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
        DataContrato = "19 de agosto de 2025",
        OnedriveExcelPath = excelPath
    });
}

var existingBens = await benRepo.GetAllAsync();
if (existingBens.Count == 0 && File.Exists(excelPath))
{
    await syncService.ImportarPlanilhaParaBancoAsync(excelPath);
}

// -------------------------------------------------------------
// ENDPOINTS REST
// -------------------------------------------------------------

// Healthcheck
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    version = "1.0.0",
    excelFound = File.Exists(excelPath),
    excelPath,
    timestamp = DateTime.UtcNow
}));

// Contrato
app.MapGet("/api/contrato", async (ContratoRepository repo) =>
{
    var contrato = await repo.GetAsync();
    return contrato != null ? Results.Ok(contrato) : Results.NotFound();
});

app.MapPut("/api/contrato", async (ContratoConfig contrato, ContratoRepository repo) =>
{
    await repo.SaveAsync(contrato);
    return Results.Ok(contrato);
});

// Beneficiários
app.MapGet("/api/beneficiarios", async (BeneficiarioRepository repo) =>
{
    var list = await repo.GetAllAsync();
    return Results.Ok(list);
});

app.MapGet("/api/beneficiarios/{id}", async (string id, BeneficiarioRepository repo) =>
{
    var ben = await repo.GetByIdAsync(id);
    return ben != null ? Results.Ok(ben) : Results.NotFound();
});

app.MapPut("/api/beneficiarios/{id}", async (string id, Beneficiario ben, BeneficiarioRepository repo) =>
{
    var existing = await repo.GetByIdAsync(id);
    if (existing == null) return Results.NotFound();

    var updated = ben with { Id = id };
    await repo.SaveAsync(updated);
    return Results.Ok(updated);
});

// Pagamentos
app.MapGet("/api/pagamentos", async (PagamentoRepository repo) =>
{
    var list = await repo.GetAllAsync();
    return Results.Ok(list.OrderBy(p => p.ParcelaNumero).ThenBy(p => p.BeneficiarioNome));
});

app.MapGet("/api/pagamentos/{id}", async (string id, PagamentoRepository repo) =>
{
    var pag = await repo.GetByIdAsync(id);
    return pag != null ? Results.Ok(pag) : Results.NotFound();
});

// Função auxiliar para obter o caminho ativo da planilha do contrato (com fallback para excelPath)
async Task<string> ObterCaminhoPlanilhaAsync(ContratoRepository repo)
{
    var c = await repo.GetAsync();
    return !string.IsNullOrEmpty(c?.OnedriveExcelPath) ? c.OnedriveExcelPath : excelPath;
}

app.MapPost("/api/pagamentos/{id}/quitar", async (
    string id,
    [FromBody] QuitarRequest? req,
    PaymentService paymentService,
    SyncService sync,
    PagamentoRepository repo,
    ContratoRepository contratoRepo) =>
{
    var result = await paymentService.QuitarParcelaAsync(id, req?.DataPagamento);
    if (!result.IsSuccess)
        return Results.BadRequest(new { error = result.Error });

    var caminhoExcel = await ObterCaminhoPlanilhaAsync(contratoRepo);
    if (File.Exists(caminhoExcel))
    {
        await sync.SincronizarParcelaComPlanilhaAsync(caminhoExcel, id);
    }

    var atualizado = await repo.GetByIdAsync(id);
    return Results.Ok(atualizado);
});

// Reverter Parcela
app.MapPost("/api/pagamentos/{id}/reverter", async (
    string id,
    PaymentService paymentService,
    SyncService sync,
    PagamentoRepository repo,
    ContratoRepository contratoRepo) =>
{
    var result = await paymentService.ReverterParcelaAsync(id);
    if (!result.IsSuccess)
        return Results.BadRequest(new { error = result.Error });

    var caminhoExcel = await ObterCaminhoPlanilhaAsync(contratoRepo);
    if (File.Exists(caminhoExcel))
    {
        await sync.SincronizarParcelaComPlanilhaAsync(caminhoExcel, id);
    }

    var atualizado = await repo.GetByIdAsync(id);
    return Results.Ok(atualizado);
});

// Quitar Parcelas em Lote
app.MapPost("/api/pagamentos/lote/quitar", async (
    [FromBody] QuitarLoteRequest req,
    PaymentService paymentService,
    SyncService sync,
    ContratoRepository contratoRepo) =>
{
    if (req?.Ids == null || req.Ids.Count == 0)
        return Results.BadRequest(new { error = "Nenhum ID de parcela fornecido." });

    var result = await paymentService.QuitarParcelasLoteAsync(req.Ids, req.DataPagamento);
    if (!result.IsSuccess)
        return Results.BadRequest(new { error = result.Error });

    var caminhoExcel = await ObterCaminhoPlanilhaAsync(contratoRepo);
    if (File.Exists(caminhoExcel))
    {
        await sync.SincronizarParcelasComPlanilhaAsync(caminhoExcel, req.Ids);
    }

    return Results.Ok(new { success = true, count = req.Ids.Count });
});

// Reverter Parcelas em Lote
app.MapPost("/api/pagamentos/lote/reverter", async (
    [FromBody] List<string> ids,
    PaymentService paymentService,
    SyncService sync,
    ContratoRepository contratoRepo) =>
{
    if (ids == null || ids.Count == 0)
        return Results.BadRequest(new { error = "Nenhum ID de parcela fornecido." });

    var result = await paymentService.ReverterParcelasLoteAsync(ids);
    if (!result.IsSuccess)
        return Results.BadRequest(new { error = result.Error });

    var caminhoExcel = await ObterCaminhoPlanilhaAsync(contratoRepo);
    if (File.Exists(caminhoExcel))
    {
        await sync.SincronizarParcelasComPlanilhaAsync(caminhoExcel, ids);
    }

    return Results.Ok(new { success = true, count = ids.Count });
});

// Criar nova parcela
app.MapPost("/api/pagamentos", async (
    Pagamento pagamento,
    PagamentoRepository repo,
    PaymentService paymentService) =>
{
    await repo.SaveAsync(pagamento);
    await paymentService.RecalcularSaldosAsync(pagamento.BeneficiarioId);
    var saved = await repo.GetByIdAsync(pagamento.Id);
    return Results.Created($"/api/pagamentos/{pagamento.Id}", saved);
});

// Excluir parcela
app.MapDelete("/api/pagamentos/{id}", async (
    string id,
    PagamentoRepository repo,
    PaymentService paymentService) =>
{
    var pag = await repo.GetByIdAsync(id);
    if (pag == null) return Results.NotFound();

    await repo.DeleteAsync(id);
    await paymentService.RecalcularSaldosAsync(pag.BeneficiarioId);
    return Results.NoContent();
});

// Bancos BACEN STR
app.MapGet("/api/bancos", async (BacenRepository repo) =>
{
    var bancos = await repo.GetAllAsync();
    return Results.Ok(bancos);
});

// Emissão de Recibo PDF Individual
app.MapGet("/api/recibos/{id}/pdf", async (
    string id,
    PagamentoRepository pagRepo,
    BeneficiarioRepository benRepo,
    ContratoRepository contratoRepo,
    QuestPdfReceiptGenerator pdfGen) =>
{
    var pag = await pagRepo.GetByIdAsync(id);
    if (pag == null) return Results.NotFound("Pagamento não encontrado.");

    var ben = await benRepo.GetByIdAsync(pag.BeneficiarioId);
    if (ben == null) return Results.NotFound("Beneficiário não encontrado.");

    var contrato = await contratoRepo.GetAsync() ?? new ContratoConfig
    {
        PagadorNome = "ABIGAIL PAULINO DA SILVA",
        PagadorCpf = "450.519.504-00",
        TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
        DataContrato = "19 de agosto de 2025"
    };

    var dados = new ReciboDados(pag, ben, contrato);
    var pdfBytes = pdfGen.GerarReciboPdf(dados);

    var valorStr = NumberToWordsPtBr.FormatarNumeroMoeda(pag.Valor);
    var fileName = QuestPdfReceiptGenerator.SanitizarNomeArquivo($"{pag.BeneficiarioNome} - Parcela {pag.ParcelaNumero} - R$ {valorStr}.pdf");

    return Results.File(pdfBytes, "application/pdf", fileName);
});

// Emissão de Lote ZIP de Recibos
app.MapPost("/api/recibos/lote-zip", async (
    [FromBody] LoteZipRequest req,
    PagamentoRepository pagRepo,
    BeneficiarioRepository benRepo,
    ContratoRepository contratoRepo,
    QuestPdfReceiptGenerator pdfGen) =>
{
    if (req.PaymentIds == null || req.PaymentIds.Count == 0)
        return Results.BadRequest(new { error = "Nenhum ID de pagamento fornecido." });

    var contrato = await contratoRepo.GetAsync() ?? new ContratoConfig
    {
        PagadorNome = "ABIGAIL PAULINO DA SILVA",
        PagadorCpf = "450.519.504-00",
        TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
        DataContrato = "19 de agosto de 2025"
    };

    var itens = new List<ReciboDados>();
    foreach (var id in req.PaymentIds)
    {
        var pag = await pagRepo.GetByIdAsync(id);
        if (pag == null) continue;
        var ben = await benRepo.GetByIdAsync(pag.BeneficiarioId);
        if (ben == null) continue;
        itens.Add(new ReciboDados(pag, ben, contrato));
    }

    if (itens.Count == 0)
        return Results.NotFound(new { error = "Nenhum pagamento válido encontrado para os IDs informados." });

    var zipBytes = pdfGen.GerarLoteZip(itens);
    return Results.File(zipBytes, "application/zip", "recibos-lote.zip");
});

// Sincronização com Excel
app.MapPost("/api/sync/excel", async (SyncService sync, ContratoRepository contratoRepo) =>
{
    var caminhoExcel = await ObterCaminhoPlanilhaAsync(contratoRepo);
    if (!File.Exists(caminhoExcel))
        return Results.NotFound(new { error = $"Arquivo Excel não encontrado em '{caminhoExcel}'." });

    var res = await sync.ImportarPlanilhaParaBancoAsync(caminhoExcel);
    if (!res.IsSuccess)
        return Results.BadRequest(new { error = res.Error });

    return Results.Ok(new
    {
        message = "Sincronização com Excel concluída com sucesso.",
        beneficiarios = res.Value.BeneficiariosImportados,
        pagamentos = res.Value.PagamentosImportados
    });
});

if (!string.IsNullOrEmpty(distDir))
{
    var fileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(distDir);
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = fileProvider });
}

app.Run();

record QuitarRequest(string? DataPagamento);
record QuitarLoteRequest(List<string> Ids, string? DataPagamento);
record LoteZipRequest(List<string> PaymentIds);

public partial class Program { }
