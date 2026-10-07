using System.Globalization;
using AppRecibos.Core.Domain.Common;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using ClosedXML.Excel;

namespace AppRecibos.Core.Infrastructure.Excel;

public class ExcelSyncEngine
{
    private const int MaxRetries = 5;
    private const int DelayBetweenRetriesMs = 500;

    private static Dictionary<string, int> GetColumnMap(IXLTable table)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        int colIndex = 1;
        foreach (var cell in table.HeadersRow().Cells())
        {
            map[cell.GetString().Trim()] = colIndex++;
        }
        return map;
    }

    private static decimal GetDecimalValue(IXLCell cell)
    {
        if (cell.IsEmpty()) return 0m;
        if (cell.HasFormula)
        {
            var cv = cell.CachedValue;
            if (cv.IsNumber) return Convert.ToDecimal(cv.GetNumber());
            var str = cv.ToString().Trim();
            if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
                return parsed;
            if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("pt-BR"), out var parsedPt))
                return parsedPt;
            return 0m;
        }
        return Convert.ToDecimal(cell.GetDouble());
    }

    private static string GetStringValue(IXLCell cell)
    {
        if (cell.IsEmpty()) return string.Empty;
        if (cell.HasFormula)
        {
            return cell.CachedValue.ToString().Trim();
        }
        return cell.GetString().Trim();
    }

    public async Task<Result<(IReadOnlyList<Beneficiario> Beneficiarios, IReadOnlyList<Pagamento> Pagamentos)>> LerPlanilhaAsync(string filePath)
    {
        if (!File.Exists(filePath))
            return Result<(IReadOnlyList<Beneficiario>, IReadOnlyList<Pagamento>)>.Failure($"Arquivo '{filePath}' não encontrado.");

        try
        {
            byte[] fileBytes;
            using (var fs = await AbrirStreamComRetryAsync(filePath, FileAccess.Read, FileShare.ReadWrite))
            {
                using var ms = new MemoryStream();
                await fs.CopyToAsync(ms);
                fileBytes = ms.ToArray();
            }

            using var memStream = new MemoryStream(fileBytes);
            using var workbook = new XLWorkbook(memStream);

            var wsGeral = workbook.Worksheet("Controle Geral");
            var tabelaGeral = wsGeral.Table("GERAL");
            var gCols = GetColumnMap(tabelaGeral);

            var beneficiarios = new List<Beneficiario>();
            int benIndex = 1;
            foreach (var row in tabelaGeral.DataRange.Rows())
            {
                var nome = GetStringValue(row.Cell(gCols["NOME"]));
                if (string.IsNullOrWhiteSpace(nome)) continue;

                var cpf = GetStringValue(row.Cell(gCols["CPF"]));
                var contrato = GetDecimalValue(row.Cell(gCols["CONTRATO"]));
                var pago = GetDecimalValue(row.Cell(gCols["PAGO"]));
                var saldo = GetDecimalValue(row.Cell(gCols["SALDO"]));
                var status = GetStringValue(row.Cell(gCols["STATUS"]));
                var banco = GetStringValue(row.Cell(gCols["BANCO"]));
                var ag = GetStringValue(row.Cell(gCols["AG"]));
                var conta = GetStringValue(row.Cell(gCols["CONTA"]));
                var op = GetStringValue(row.Cell(gCols["OP"]));
                var tipoConta = GetStringValue(row.Cell(gCols["TIPO"]));
                var pix = GetStringValue(row.Cell(gCols["PIX"]));

                beneficiarios.Add(new Beneficiario
                {
                    Id = $"ben-{benIndex++}",
                    Nome = nome,
                    Cpf = cpf,
                    ContratoTotal = contrato,
                    TotalPago = pago,
                    SaldoDevedor = saldo,
                    Status = status,
                    Banco = banco,
                    Agencia = ag,
                    Conta = conta,
                    Operacao = op,
                    TipoConta = tipoConta,
                    ChavePix = pix,
                    TipoChavePix = pix.Contains("@") ? "E-MAIL" : (pix.Contains("(") ? "TELEFONE" : "CPF"),
                    CidadeUf = "Maceió - AL"
                });
            }

            var wsParcelas = workbook.Worksheet("Registro de Pagamentos");
            var tabelaParcelas = wsParcelas.Table("PARCELAS");
            var pCols = GetColumnMap(tabelaParcelas);

            var pagamentos = new List<Pagamento>();
            int pgIndex = 1;
            var parcelaCounters = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var benAcumuladoPago = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in tabelaParcelas.DataRange.Rows())
            {
                var nome = GetStringValue(row.Cell(pCols["NOME"]));
                if (string.IsNullOrWhiteSpace(nome)) continue;

                parcelaCounters[nome] = parcelaCounters.GetValueOrDefault(nome, 0) + 1;
                var numParcela = (int)GetDecimalValue(row.Cell(pCols["PARCELA"]));
                if (numParcela <= 0)
                {
                    numParcela = parcelaCounters[nome];
                }

                var statusStr = GetStringValue(row.Cell(pCols["STATUS"]));
                var status = string.Equals(statusStr, "PAGO", StringComparison.OrdinalIgnoreCase) 
                    ? StatusParcela.Pago 
                    : StatusParcela.Previsto;

                var valor = GetDecimalValue(row.Cell(pCols["VALOR"]));
                
                string? dataPagamento = null;
                var cellDataPag = row.Cell(pCols["DATA PAGAMENTO"]);
                if (!cellDataPag.IsEmpty())
                {
                    if (cellDataPag.DataType == XLDataType.DateTime)
                        dataPagamento = cellDataPag.GetDateTime().ToString("yyyy-MM-dd");
                    else if (cellDataPag.DataType == XLDataType.Number)
                        dataPagamento = DateTime.FromOADate(cellDataPag.GetDouble()).ToString("yyyy-MM-dd");
                    else
                    {
                        var str = cellDataPag.GetString().Trim();
                        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtParsed))
                            dataPagamento = dtParsed.ToString("yyyy-MM-dd");
                        else if (DateTime.TryParse(str, new CultureInfo("pt-BR"), DateTimeStyles.None, out var dtParsedPt))
                            dataPagamento = dtParsedPt.ToString("yyyy-MM-dd");
                    }
                }

                string? dataPrevista = null;
                var cellDataPrev = row.Cell(pCols["DATA PREVISTA"]);
                if (!cellDataPrev.IsEmpty())
                {
                    if (cellDataPrev.DataType == XLDataType.DateTime)
                        dataPrevista = cellDataPrev.GetDateTime().ToString("yyyy-MM-dd");
                    else if (cellDataPrev.DataType == XLDataType.Number)
                        dataPrevista = DateTime.FromOADate(cellDataPrev.GetDouble()).ToString("yyyy-MM-dd");
                    else
                    {
                        var str = cellDataPrev.GetString().Trim();
                        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtParsed))
                            dataPrevista = dtParsed.ToString("yyyy-MM-dd");
                        else if (DateTime.TryParse(str, new CultureInfo("pt-BR"), DateTimeStyles.None, out var dtParsedPt))
                            dataPrevista = dtParsedPt.ToString("yyyy-MM-dd");
                    }
                }

                var ben = beneficiarios.FirstOrDefault(b => b.Nome == nome);
                var benId = ben?.Id ?? "ben-unknown";

                var cpf = GetStringValue(row.Cell(pCols["CPF"]));
                if (string.IsNullOrWhiteSpace(cpf) && ben != null)
                    cpf = ben.Cpf;

                var formaPgto = GetStringValue(row.Cell(pCols["FORMA PGTO"]));
                var chavePix = GetStringValue(row.Cell(pCols["CHAVE PIX"]));
                if (string.IsNullOrWhiteSpace(chavePix) && ben != null)
                    chavePix = ben.ChavePix;

                var banco = GetStringValue(row.Cell(pCols["BANCO"]));
                if (string.IsNullOrWhiteSpace(banco) && ben != null)
                    banco = ben.Banco;

                // Saldo devedor calculation fallback
                if (status == StatusParcela.Pago)
                {
                    benAcumuladoPago[nome] = benAcumuladoPago.GetValueOrDefault(nome, 0m) + valor;
                }
                var saldo = GetDecimalValue(row.Cell(pCols["SALDO DEVEDOR"]));
                if (saldo <= 0 && ben != null)
                {
                    saldo = Math.Max(0m, ben.ContratoTotal - benAcumuladoPago.GetValueOrDefault(nome, 0m));
                }

                var dia = GetStringValue(row.Cell(pCols["DIA"]));
                var mes = GetStringValue(row.Cell(pCols["MÊS"]));
                var ano = GetStringValue(row.Cell(pCols["ANO"]));

                if (!string.IsNullOrWhiteSpace(dataPagamento) && DateTime.TryParse(dataPagamento, out var dtVal))
                {
                    if (string.IsNullOrWhiteSpace(dia))
                        dia = dtVal.Day.ToString("00");
                    if (string.IsNullOrWhiteSpace(mes))
                        mes = dtVal.ToString("MMMM", new CultureInfo("pt-BR"));
                    if (string.IsNullOrWhiteSpace(ano))
                        ano = dtVal.Year.ToString();
                }

                var cidadeUf = GetStringValue(row.Cell(pCols["CIDADE / UF"]));

                pagamentos.Add(new Pagamento
                {
                    Id = $"pg-{pgIndex++}",
                    BeneficiarioId = benId,
                    BeneficiarioNome = nome,
                    BeneficiarioCpf = cpf,
                    ParcelaNumero = numParcela,
                    Valor = valor,
                    Status = status,
                    DataPrevista = dataPrevista,
                    DataPagamento = dataPagamento,
                    FormaPgto = string.IsNullOrWhiteSpace(formaPgto) ? "PIX" : formaPgto,
                    ChavePix = chavePix,
                    Banco = banco,
                    SaldoAposParcela = saldo,
                    Dia = dia,
                    Mes = mes,
                    Ano = ano,
                    CidadeUf = string.IsNullOrWhiteSpace(cidadeUf) ? "Maceió - AL" : cidadeUf
                });
            }

            return Result<(IReadOnlyList<Beneficiario>, IReadOnlyList<Pagamento>)>.Success((beneficiarios, pagamentos));
        }
        catch (Exception ex)
        {
            return Result<(IReadOnlyList<Beneficiario>, IReadOnlyList<Pagamento>)>.Failure($"Erro ao ler planilha: {ex.Message}");
        }
    }

    public async Task<Result> AtualizarParcelaNaPlanilhaAsync(string filePath, Pagamento pagamento)
    {
        return await AtualizarParcelasNaPlanilhaAsync(filePath, new[] { pagamento });
    }

    public async Task<Result> AtualizarParcelasNaPlanilhaAsync(string filePath, IEnumerable<Pagamento> pagamentos)
    {
        if (!File.Exists(filePath))
            return Result.Failure($"Arquivo '{filePath}' não encontrado.");

        var pagamentosList = pagamentos.ToList();
        if (!pagamentosList.Any())
            return Result.Success();

        try
        {
            byte[] fileBytes;
            using (var fs = await AbrirStreamComRetryAsync(filePath, FileAccess.Read, FileShare.ReadWrite))
            {
                using var ms = new MemoryStream();
                await fs.CopyToAsync(ms);
                fileBytes = ms.ToArray();
            }

            using var memStream = new MemoryStream(fileBytes);
            using var workbook = new XLWorkbook(memStream);

            var ws = workbook.Worksheet("Registro de Pagamentos");
            var tabela = ws.Table("PARCELAS");
            var pCols = GetColumnMap(tabela);

            var parcelaCounters = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var rowMap = new Dictionary<string, IXLRangeRow>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in tabela.DataRange.Rows())
            {
                var rowNome = GetStringValue(row.Cell(pCols["NOME"]));
                if (string.IsNullOrWhiteSpace(rowNome)) continue;

                parcelaCounters[rowNome] = parcelaCounters.GetValueOrDefault(rowNome, 0) + 1;
                var rowParcela = (int)GetDecimalValue(row.Cell(pCols["PARCELA"]));
                if (rowParcela <= 0)
                {
                    rowParcela = parcelaCounters[rowNome];
                }

                var key = $"{rowNome}_{rowParcela}";
                rowMap[key] = row;
            }

            foreach (var pagamento in pagamentosList)
            {
                var key = $"{pagamento.BeneficiarioNome}_{pagamento.ParcelaNumero}";
                if (!rowMap.TryGetValue(key, out var targetRow))
                    continue;

                // Atualiza STATUS (PAGO / PREVISTO em maiúsculas)
                targetRow.Cell(pCols["STATUS"]).SetValue(pagamento.Status == StatusParcela.Pago ? "PAGO" : "PREVISTO");

                // Atualiza VALOR
                if (pagamento.Valor > 0)
                    targetRow.Cell(pCols["VALOR"]).SetValue((double)pagamento.Valor);

                // Atualiza DATA PAGAMENTO
                if (pagamento.Status == StatusParcela.Pago && !string.IsNullOrWhiteSpace(pagamento.DataPagamento))
                {
                    if (DateTime.TryParseExact(pagamento.DataPagamento, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                        targetRow.Cell(pCols["DATA PAGAMENTO"]).SetValue(dt);
                }
                else
                {
                    targetRow.Cell(pCols["DATA PAGAMENTO"]).Clear();
                }

                // Atualiza DATA PREVISTA
                if (!string.IsNullOrWhiteSpace(pagamento.DataPrevista))
                {
                    if (DateTime.TryParseExact(pagamento.DataPrevista, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                        targetRow.Cell(pCols["DATA PREVISTA"]).SetValue(dt);
                }

                if (!string.IsNullOrWhiteSpace(pagamento.FormaPgto))
                    targetRow.Cell(pCols["FORMA PGTO"]).SetValue(pagamento.FormaPgto);
            }

            // Salvar para buffer de memória
            using var outMs = new MemoryStream();
            workbook.SaveAs(outMs);
            var updatedBytes = outMs.ToArray();

            // Gravar atomicamente no arquivo com retry
            for (int i = 0; i < MaxRetries; i++)
            {
                try
                {
                    using var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.Read);
                    await fs.WriteAsync(updatedBytes);
                    await fs.FlushAsync();
                    break;
                }
                catch (IOException) when (i < MaxRetries - 1)
                {
                    await Task.Delay(DelayBetweenRetriesMs);
                }
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Erro ao atualizar parcelas na planilha: {ex.Message}");
        }
    }

    private static async Task<FileStream> AbrirStreamComRetryAsync(string path, FileAccess access, FileShare share)
    {
        for (int i = 0; i < MaxRetries; i++)
        {
            try
            {
                return new FileStream(path, FileMode.Open, access, share);
            }
            catch (IOException) when (i < MaxRetries - 1)
            {
                await Task.Delay(DelayBetweenRetriesMs);
            }
        }
        return new FileStream(path, FileMode.Open, access, share);
    }
}
