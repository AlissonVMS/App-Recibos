using System.IO.Compression;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Services;
using FluentAssertions;
using Xunit;

namespace AppRecibos.Tests;

public class ReceiptGeneratorTests
{
    private readonly QuestPdfReceiptGenerator _generator = new();

    [Theory]
    [InlineData(1000, "mil reais")]
    [InlineData(8500, "oito mil e quinhentos reais")]
    [InlineData(500, "quinhentos reais")]
    [InlineData(10000, "dez mil reais")]
    [InlineData(100, "cem reais")]
    [InlineData(1, "um real")]
    [InlineData(0, "zero reais")]
    public void NumberToWordsPtBr_ValoresInteiros_DeveConverterCorretamente(decimal valor, string esperado)
    {
        var resultado = NumberToWordsPtBr.ValorPorExtenso(valor);
        resultado.Should().Be(esperado);
    }

    [Fact]
    public void NumberToWordsPtBr_ValorComCentavos_DeveConverterCorretamente()
    {
        var resultado = NumberToWordsPtBr.ValorPorExtenso(1000.50m);
        resultado.Should().Be("mil reais e cinquenta centavos");
    }

    [Theory]
    [InlineData("260 - Nu Pagamentos S.A. (Nubank)", "Nu Pagamentos S.A.")]
    [InlineData("104 - Caixa Econômica Federal", "Caixa Econômica Federal")]
    [InlineData("001 - Banco do Brasil S.A.", "Banco do Brasil S.A.")]
    [InlineData("Banco Inter S.A. (Inter)", "Banco Inter S.A.")]
    [InlineData("336 - Banco C6 S.A.", "Banco C6 S.A.")]
    public void ExtrairNomePuroBanco_DeveRemoverCodigosEParenteses(string bancoOriginal, string esperado)
    {
        var resultado = QuestPdfReceiptGenerator.ExtrairNomePuroBanco(bancoOriginal);
        resultado.Should().Be(esperado);
    }

    [Fact]
    public void GerarReciboPdf_DeveGerarPdfValidoEmMemoria()
    {
        var contrato = new ContratoConfig
        {
            PagadorNome = "ABIGAIL PAULINO DA SILVA",
            PagadorCpf = "450.519.504-00",
            TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
            DataContrato = "19 de agosto de 2025"
        };

        var beneficiario = new Beneficiario
        {
            Id = "ben-1",
            Nome = "ELISANGELA MARIA VASCONCELOS DE ARAÚJO",
            Cpf = "341.267.018-93",
            ContratoTotal = 30000m,
            TotalPago = 21500m,
            SaldoDevedor = 8500m,
            Status = "EM ABERTO",
            Banco = "104 - Caixa Econômica Federal",
            TipoConta = "CORRENTE",
            ChavePix = "(82)99929-1488",
            CidadeUf = "Barra de São Miguel - AL"
        };

        var pagamento = new Pagamento
        {
            Id = "pg-9",
            BeneficiarioId = "ben-1",
            BeneficiarioNome = "ELISANGELA MARIA VASCONCELOS DE ARAÚJO",
            BeneficiarioCpf = "341.267.018-93",
            ParcelaNumero = 9,
            Valor = 1000m,
            Status = StatusParcela.Pago,
            DataPagamento = "2026-05-11",
            FormaPgto = "PIX",
            ChavePix = "(82)99929-1488",
            Banco = "104 - Caixa Econômica Federal",
            SaldoAposParcela = 8500m,
            Dia = "11",
            Mes = "maio",
            Ano = "2026",
            CidadeUf = "Barra de São Miguel - AL"
        };

        var dados = new ReciboDados(pagamento, beneficiario, contrato);
        var pdfBytes = _generator.GerarReciboPdf(dados);

        pdfBytes.Should().NotBeNull();
        pdfBytes.Length.Should().BeGreaterThan(1000);

        // Header %PDF
        var header = System.Text.Encoding.ASCII.GetString(pdfBytes[..4]);
        header.Should().Be("%PDF");
    }

    [Fact]
    public void GerarLoteZip_DeveConterArquivosPdfValidosEmMemoria()
    {
        var contrato = new ContratoConfig
        {
            PagadorNome = "ABIGAIL PAULINO DA SILVA",
            PagadorCpf = "450.519.504-00",
            TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
            DataContrato = "19 de agosto de 2025"
        };

        var itens = new List<ReciboDados>();
        for (int i = 1; i <= 3; i++)
        {
            var ben = new Beneficiario
            {
                Id = $"ben-{i}",
                Nome = $"BENEFICIÁRIO {i}",
                Cpf = $"000.000.00{i}-00",
                ContratoTotal = 30000m,
                TotalPago = 10000m,
                SaldoDevedor = 20000m,
                Status = "EM ABERTO",
                Banco = "260 - Nu Pagamentos S.A. (Nubank)",
                TipoConta = "CORRENTE",
                ChavePix = $"chave-{i}",
                CidadeUf = "Maceió - AL"
            };

            var pag = new Pagamento
            {
                Id = $"pg-{i}",
                BeneficiarioId = $"ben-{i}",
                BeneficiarioNome = ben.Nome,
                BeneficiarioCpf = ben.Cpf,
                ParcelaNumero = i,
                Valor = 1000m,
                Status = StatusParcela.Pago,
                DataPagamento = "2026-10-10",
                FormaPgto = "PIX",
                ChavePix = ben.ChavePix,
                Banco = ben.Banco,
                SaldoAposParcela = 20000m,
                Dia = "10",
                Mes = "outubro",
                Ano = "2026",
                CidadeUf = "Maceió - AL"
            };

            itens.Add(new ReciboDados(pag, ben, contrato));
        }

        var zipBytes = _generator.GerarLoteZip(itens);
        zipBytes.Should().NotBeNull();
        zipBytes.Length.Should().BeGreaterThan(100);

        // Header PK
        var header = System.Text.Encoding.ASCII.GetString(zipBytes[..2]);
        header.Should().Be("PK");

        using var ms = new MemoryStream(zipBytes);
        using var archive = new ZipArchive(ms, ZipArchiveMode.Read);
        archive.Entries.Should().HaveCount(3);

        foreach (var entry in archive.Entries)
        {
            entry.Name.Should().EndWith(".pdf");
            using var entryStream = entry.Open();
            using var mem = new MemoryStream();
            entryStream.CopyTo(mem);
            mem.Length.Should().BeGreaterThan(1000);
            var entryHeader = System.Text.Encoding.ASCII.GetString(mem.ToArray()[..4]);
            entryHeader.Should().Be("%PDF");
        }
    }
}
