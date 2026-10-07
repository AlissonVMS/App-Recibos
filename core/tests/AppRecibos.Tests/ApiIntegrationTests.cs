using System.Net;
using System.Net.Http.Json;
using AppRecibos.Core.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace AppRecibos.Tests;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_DeveRetornarStatusHealthy()
    {
        var response = await _client.GetAsync("/api/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact]
    public async Task GetContrato_DeveRetornarContratoConfig()
    {
        var response = await _client.GetAsync("/api/contrato");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var contrato = await response.Content.ReadFromJsonAsync<ContratoConfig>();
        contrato.Should().NotBeNull();
        contrato!.PagadorNome.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetBeneficiarios_DeveRetornarListaDeBeneficiarios()
    {
        var response = await _client.GetAsync("/api/beneficiarios");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var lista = await response.Content.ReadFromJsonAsync<List<Beneficiario>>();
        lista.Should().NotBeNull();
        lista!.Count.Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public async Task GetPagamentos_DeveRetornarListaDePagamentos()
    {
        var response = await _client.GetAsync("/api/pagamentos");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var pagamentos = await response.Content.ReadFromJsonAsync<List<Pagamento>>();
        pagamentos.Should().NotBeNull();
        pagamentos!.Count.Should().BeGreaterThanOrEqualTo(54);
    }

    [Fact]
    public async Task GetReciboPdf_DeveRetornarPdfValido()
    {
        // 1. Obter primeiro pagamento
        var pagamentosRes = await _client.GetAsync("/api/pagamentos");
        var pagamentos = await pagamentosRes.Content.ReadFromJsonAsync<List<Pagamento>>();
        pagamentos.Should().NotBeNull();
        var primeiro = pagamentos!.First();

        // 2. Gerar PDF
        var pdfRes = await _client.GetAsync($"/api/recibos/{primeiro.Id}/pdf");
        pdfRes.StatusCode.Should().Be(HttpStatusCode.OK);
        pdfRes.Content.Headers.ContentType!.MediaType.Should().Be("application/pdf");

        var bytes = await pdfRes.Content.ReadAsByteArrayAsync();
        bytes.Length.Should().BeGreaterThan(1000);
        var header = System.Text.Encoding.ASCII.GetString(bytes[..4]);
        header.Should().Be("%PDF");
    }

    [Fact]
    public async Task PostRecibosLoteZip_DeveRetornarZipValido()
    {
        var pagamentosRes = await _client.GetAsync("/api/pagamentos");
        var pagamentos = await pagamentosRes.Content.ReadFromJsonAsync<List<Pagamento>>();
        var ids = pagamentos!.Take(2).Select(p => p.Id).ToList();

        var response = await _client.PostAsJsonAsync("/api/recibos/lote-zip", new { paymentIds = ids });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/zip");

        var zipBytes = await response.Content.ReadAsByteArrayAsync();
        zipBytes.Length.Should().BeGreaterThan(100);
        var header = System.Text.Encoding.ASCII.GetString(zipBytes[..2]);
        header.Should().Be("PK");
    }

    [Fact]
    public async Task GetPagamentos_DeveRetornarStatusEmMaiusculas()
    {
        var response = await _client.GetAsync("/api/pagamentos");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        // Verifica que o JSON serializado contém "status":"PAGO" ou "status":"PREVISTO"
        json.Should().Contain("\"status\":\"PAGO\"");
    }

    [Fact]
    public async Task PostLoteQuitarELoteReverter_DeveProcessarComSucesso()
    {
        // Isola o arquivo Excel em cópia temporária para não alterar o arquivo raiz do repositório
        var contratoRes = await _client.GetAsync("/api/contrato");
        var contrato = await contratoRes.Content.ReadFromJsonAsync<ContratoConfig>();
        string? originalExcel = contrato?.OnedriveExcelPath;
        string? tempExcel = null;

        if (contrato != null && !string.IsNullOrEmpty(originalExcel) && File.Exists(originalExcel))
        {
            tempExcel = Path.Combine(Path.GetTempPath(), $"test_batch_api_{Guid.NewGuid():N}.xlsx");
            File.Copy(originalExcel, tempExcel, true);
            contrato = contrato with { OnedriveExcelPath = tempExcel };
            await _client.PutAsJsonAsync("/api/contrato", contrato);
        }

        try
        {
            var pagamentosRes = await _client.GetAsync("/api/pagamentos");
            var pagamentos = await pagamentosRes.Content.ReadFromJsonAsync<List<Pagamento>>();
            var ids = pagamentos!.Take(2).Select(p => p.Id).ToList();

            // 1. Quitar lote
            var quitarRes = await _client.PostAsJsonAsync("/api/pagamentos/lote/quitar", new { ids, dataPagamento = "2026-10-07" });
            quitarRes.StatusCode.Should().Be(HttpStatusCode.OK);

            // 2. Reverter lote
            var reverterRes = await _client.PostAsJsonAsync("/api/pagamentos/lote/reverter", ids);
            reverterRes.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            if (contrato != null && !string.IsNullOrEmpty(originalExcel))
            {
                contrato = contrato with { OnedriveExcelPath = originalExcel };
                await _client.PutAsJsonAsync("/api/contrato", contrato);
            }
            if (tempExcel != null && File.Exists(tempExcel))
            {
                try { File.Delete(tempExcel); } catch { }
            }
        }
    }
}
