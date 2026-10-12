using System.Globalization;
using System.IO.Compression;
using System.Xml.Linq;
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
                var nome = gCols.TryGetValue("NOME", out var cNome) ? GetStringValue(row.Cell(cNome)) : "";
                if (string.IsNullOrWhiteSpace(nome)) continue;

                var cpf = gCols.TryGetValue("CPF", out var cCpf) ? GetStringValue(row.Cell(cCpf)) : "";
                var contrato = gCols.TryGetValue("CONTRATO", out var cContrato) ? GetDecimalValue(row.Cell(cContrato)) : 30000m;
                var pago = gCols.TryGetValue("PAGO", out var cPago) ? GetDecimalValue(row.Cell(cPago)) : 0m;
                var saldo = gCols.TryGetValue("SALDO", out var cSaldo) ? GetDecimalValue(row.Cell(cSaldo)) : Math.Max(0m, contrato - pago);
                var status = gCols.TryGetValue("STATUS", out var cStatus) ? GetStringValue(row.Cell(cStatus)) : "EM ABERTO";
                var banco = gCols.TryGetValue("BANCO", out var cBanco) ? GetStringValue(row.Cell(cBanco)) : "";
                var ag = gCols.TryGetValue("AG", out var cAg) ? GetStringValue(row.Cell(cAg)) : "";
                var conta = gCols.TryGetValue("CONTA", out var cConta) ? GetStringValue(row.Cell(cConta)) : "";
                var op = gCols.TryGetValue("OP", out var cOp) ? GetStringValue(row.Cell(cOp)) : "";
                var tipoConta = gCols.TryGetValue("TIPO", out var cTipo) ? GetStringValue(row.Cell(cTipo)) : "POUPANÇA";
                var pix = gCols.TryGetValue("PIX", out var cPix) ? GetStringValue(row.Cell(cPix)) : "";

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
                int colNome = pCols.GetValueOrDefault("NOME", 1);
                var nome = GetStringValue(row.Cell(colNome));
                if (string.IsNullOrWhiteSpace(nome)) continue;

                parcelaCounters[nome] = parcelaCounters.GetValueOrDefault(nome, 0) + 1;
                int colParcela = pCols.GetValueOrDefault("PARCELA", 3);
                var numParcela = (int)GetDecimalValue(row.Cell(colParcela));
                if (numParcela <= 0)
                {
                    numParcela = parcelaCounters[nome];
                }

                int colValor = pCols.GetValueOrDefault("VALOR", 4);
                var valor = GetDecimalValue(row.Cell(colValor));

                // Data de pagamento: na planilha original se chama "DATA", em outras pode ser "DATA PAGAMENTO"
                int colDataPag = 0;
                if (pCols.TryGetValue("DATA", out var cd)) colDataPag = cd;
                else if (pCols.TryGetValue("DATA PAGAMENTO", out var cdp)) colDataPag = cdp;

                string? dataPagamento = null;
                if (colDataPag > 0)
                {
                    var cellDataPag = row.Cell(colDataPag);
                    if (!cellDataPag.IsEmpty())
                    {
                        if (cellDataPag.DataType == XLDataType.DateTime)
                            dataPagamento = cellDataPag.GetDateTime().ToString("yyyy-MM-dd");
                        else if (cellDataPag.DataType == XLDataType.Number)
                        {
                            var num = cellDataPag.GetDouble();
                            if (num > 30000 && num < 70000) // Data serial Excel válida (~1982 a ~2091)
                                dataPagamento = DateTime.FromOADate(num).ToString("yyyy-MM-dd");
                        }
                        else
                        {
                            var str = cellDataPag.GetString().Trim();
                            if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtParsed))
                                dataPagamento = dtParsed.ToString("yyyy-MM-dd");
                            else if (DateTime.TryParse(str, new CultureInfo("pt-BR"), DateTimeStyles.None, out var dtParsedPt))
                                dataPagamento = dtParsedPt.ToString("yyyy-MM-dd");
                        }
                    }
                }

                // Status da Parcela:
                StatusParcela status;
                if (pCols.TryGetValue("STATUS", out var colStatus))
                {
                    var statusStr = GetStringValue(row.Cell(colStatus));
                    if (string.Equals(statusStr, "PAGO", StringComparison.OrdinalIgnoreCase))
                    {
                        status = StatusParcela.Pago;
                    }
                    else if (string.Equals(statusStr, "PREVISTO", StringComparison.OrdinalIgnoreCase))
                    {
                        status = StatusParcela.Previsto;
                    }
                    else
                    {
                        status = !string.IsNullOrWhiteSpace(dataPagamento) ? StatusParcela.Pago : StatusParcela.Previsto;
                    }
                }
                else
                {
                    status = !string.IsNullOrWhiteSpace(dataPagamento) ? StatusParcela.Pago : StatusParcela.Previsto;
                }

                // Data prevista se existir
                string? dataPrevista = null;
                if (pCols.TryGetValue("DATA PREVISTA", out var colDataPrev))
                {
                    var cellDataPrev = row.Cell(colDataPrev);
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
                }
                if (string.IsNullOrWhiteSpace(dataPrevista) && !string.IsNullOrWhiteSpace(dataPagamento))
                {
                    dataPrevista = dataPagamento;
                }

                var ben = beneficiarios.FirstOrDefault(b => b.Nome == nome);
                var benId = ben?.Id ?? "ben-unknown";

                int colCpf = pCols.GetValueOrDefault("CPF", 2);
                var cpf = GetStringValue(row.Cell(colCpf));
                if (string.IsNullOrWhiteSpace(cpf) && ben != null)
                    cpf = ben.Cpf;

                int colForma = pCols.GetValueOrDefault("FORMA PGTO", 0);
                var formaPgto = colForma > 0 ? GetStringValue(row.Cell(colForma)) : "PIX";

                int colChave = 0;
                if (pCols.TryGetValue("CHAVE", out var cCh)) colChave = cCh;
                else if (pCols.TryGetValue("CHAVE PIX", out var cChPix)) colChave = cChPix;
                var chavePix = colChave > 0 ? GetStringValue(row.Cell(colChave)) : "";
                if (string.IsNullOrWhiteSpace(chavePix) && ben != null)
                    chavePix = ben.ChavePix;

                int colBanco = pCols.GetValueOrDefault("BANCO", 0);
                var banco = colBanco > 0 ? GetStringValue(row.Cell(colBanco)) : "";
                if (string.IsNullOrWhiteSpace(banco) && ben != null)
                    banco = ben.Banco;

                // Saldo devedor calculation fallback
                if (status == StatusParcela.Pago)
                {
                    benAcumuladoPago[nome] = benAcumuladoPago.GetValueOrDefault(nome, 0m) + valor;
                }
                int colSaldo = 0;
                if (pCols.TryGetValue("SALDO", out var cS)) colSaldo = cS;
                else if (pCols.TryGetValue("SALDO DEVEDOR", out var cSd)) colSaldo = cSd;
                var saldo = colSaldo > 0 ? GetDecimalValue(row.Cell(colSaldo)) : 0m;
                if (saldo <= 0 && ben != null)
                {
                    saldo = Math.Max(0m, ben.ContratoTotal - benAcumuladoPago.GetValueOrDefault(nome, 0m));
                }

                int colDia = pCols.GetValueOrDefault("DIA", 0);
                int colMes = pCols.GetValueOrDefault("MÊS", 0);
                int colAno = pCols.GetValueOrDefault("ANO", 0);

                var dia = colDia > 0 ? GetStringValue(row.Cell(colDia)) : "";
                var mes = colMes > 0 ? GetStringValue(row.Cell(colMes)) : "";
                var ano = colAno > 0 ? GetStringValue(row.Cell(colAno)) : "";

                if (!string.IsNullOrWhiteSpace(mes) && (decimal.TryParse(mes, out _) || mes.Length > 20))
                {
                    mes = "";
                }

                var dataReferencia = !string.IsNullOrWhiteSpace(dataPagamento) ? dataPagamento : dataPrevista;
                if (!string.IsNullOrWhiteSpace(dataReferencia) && DateTime.TryParse(dataReferencia, out var dtVal))
                {
                    if (string.IsNullOrWhiteSpace(dia))
                        dia = dtVal.Day.ToString("00");
                    if (string.IsNullOrWhiteSpace(mes))
                    {
                        var mesNome = dtVal.ToString("MMMM", new CultureInfo("pt-BR"));
                        mes = char.ToUpper(mesNome[0]) + mesNome[1..];
                    }
                    if (string.IsNullOrWhiteSpace(ano))
                        ano = dtVal.Year.ToString();
                }

                int colCidade = pCols.GetValueOrDefault("CIDADE / UF", 0);
                var cidadeUf = colCidade > 0 ? GetStringValue(row.Cell(colCidade)) : "Maceió - AL";

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

            var updatedBytes = AtualizarPlanilhaOpenXmlSurgical(fileBytes, pagamentosList);

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

    private sealed record RowParcelaInfo(string Nome, int Parcela, bool IsPago, decimal Valor, XElement? CellSaldo);

    private static byte[] AtualizarPlanilhaOpenXmlSurgical(byte[] sourceBytes, List<Pagamento> pagamentos)
    {
        using var memoryStream = new MemoryStream();
        memoryStream.Write(sourceBytes, 0, sourceBytes.Length);
        memoryStream.Position = 0;

        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Update, leaveOpen: true))
        {
            XNamespace nsMain = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
            XNamespace nsChart = "http://schemas.openxmlformats.org/drawingml/2006/chart";

            // 1. Ler SharedStrings
            var sharedStringsEntry = archive.GetEntry("xl/sharedStrings.xml");
            var sharedStrings = new List<string>();
            int idxPago = 3; 
            int idxPrevisto = 62; 

            if (sharedStringsEntry != null)
            {
                using var ssStream = sharedStringsEntry.Open();
                var ssDoc = XDocument.Load(ssStream);
                var sis = ssDoc.Root?.Elements(nsMain + "si") ?? Enumerable.Empty<XElement>();
                int i = 0;
                foreach (var si in sis)
                {
                    var text = string.Concat(si.Descendants().Where(d => d.Name == nsMain + "t").Select(d => d.Value));
                    sharedStrings.Add(text);
                    if (string.Equals(text, "PAGO", StringComparison.OrdinalIgnoreCase))
                        idxPago = i;
                    else if (string.Equals(text, "PREVISTO", StringComparison.OrdinalIgnoreCase))
                        idxPrevisto = i;
                    i++;
                }
            }

            string KeyOf(string nome, int parcela) => $"{nome.Trim().ToUpperInvariant()}_{parcela}";
            var pagMap = pagamentos.ToDictionary(p => KeyOf(p.BeneficiarioNome, p.ParcelaNumero), p => p);

            // 2. Processar sheet2.xml (Registro de Pagamentos)
            var sheet2Entry = archive.GetEntry("xl/worksheets/sheet2.xml");
            if (sheet2Entry == null)
                throw new InvalidOperationException("Planilha 'Registro de Pagamentos' (sheet2.xml) não encontrada no pacote Excel.");

            XDocument sheet2Doc;
            using (var s2Stream = sheet2Entry.Open())
            {
                sheet2Doc = XDocument.Load(s2Stream);
            }

            var sheetData = sheet2Doc.Root?.Element(nsMain + "sheetData");
            if (sheetData == null)
                throw new InvalidOperationException("Elemento sheetData não encontrado em sheet2.xml.");

            var rows = sheetData.Elements(nsMain + "row").ToList();
            var mesesPt = new[] { "", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro" };
            var parcelasData = new List<RowParcelaInfo>();

            // Mapeamento dinâmico das colunas a partir do cabeçalho da linha 1
            var headerRow = rows.FirstOrDefault(r => r.Attribute("r")?.Value == "1");
            var colLetterMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (headerRow != null)
            {
                foreach (var cell in headerRow.Elements(nsMain + "c"))
                {
                    var rVal = cell.Attribute("r")?.Value ?? "";
                    var colLetter = System.Text.RegularExpressions.Regex.Match(rVal, @"^[A-Z]+").Value;
                    if (string.IsNullOrEmpty(colLetter)) continue;

                    string headerText = "";
                    var tAttr = cell.Attribute("t")?.Value;
                    var vVal = cell.Element(nsMain + "v")?.Value;
                    if (tAttr == "s" && int.TryParse(vVal, out var sIdx) && sIdx >= 0 && sIdx < sharedStrings.Count)
                    {
                        headerText = sharedStrings[sIdx];
                    }
                    else if (tAttr == "str" || tAttr == "inlineStr")
                    {
                        headerText = cell.Element(nsMain + "v")?.Value ?? cell.Element(nsMain + "is")?.Element(nsMain + "t")?.Value ?? "";
                    }
                    else if (!string.IsNullOrEmpty(vVal))
                    {
                        headerText = vVal;
                    }

                    if (!string.IsNullOrWhiteSpace(headerText))
                    {
                        colLetterMap[headerText.Trim()] = colLetter;
                    }
                }
            }

            colLetterMap.TryGetValue("STATUS", out var colStatus);
            colLetterMap.TryGetValue("VALOR", out var colValor);

            string? colData = null;
            if (colLetterMap.TryGetValue("DATA", out var cd)) colData = cd;
            else if (colLetterMap.TryGetValue("DATA PAGAMENTO", out var cdp)) colData = cdp;

            colLetterMap.TryGetValue("DATA PREVISTA", out var colDataPrev);

            string? colSaldo = null;
            if (colLetterMap.TryGetValue("SALDO", out var cs)) colSaldo = cs;
            else if (colLetterMap.TryGetValue("SALDO DEVEDOR", out var csd)) colSaldo = csd;

            colLetterMap.TryGetValue("DIA", out var colDia);
            colLetterMap.TryGetValue("MÊS", out var colMes);
            colLetterMap.TryGetValue("ANO", out var colAno);

            foreach (var row in rows)
            {
                var rAttr = row.Attribute("r")?.Value;
                if (string.IsNullOrEmpty(rAttr) || rAttr == "1") continue;

                var cellA = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"A{rAttr}");
                string rowNome = "";
                if (cellA != null)
                {
                    var valA = cellA.Element(nsMain + "v")?.Value;
                    if (!string.IsNullOrEmpty(valA) && int.TryParse(valA, out var sIdx) && sIdx >= 0 && sIdx < sharedStrings.Count)
                    {
                        rowNome = sharedStrings[sIdx];
                    }
                }

                var cellC = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"C{rAttr}");
                int rowParcela = 0;
                if (cellC != null)
                {
                    var valC = cellC.Element(nsMain + "v")?.Value;
                    if (!string.IsNullOrEmpty(valC) && int.TryParse(valC, out var pNum))
                    {
                        rowParcela = pNum;
                    }
                }

                if (string.IsNullOrWhiteSpace(rowNome) || rowParcela <= 0) continue;

                var key = KeyOf(rowNome, rowParcela);
                if (pagMap.TryGetValue(key, out var pag))
                {
                    if (!string.IsNullOrEmpty(colStatus))
                    {
                        var cellStatus = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colStatus}{rAttr}");
                        if (cellStatus != null)
                        {
                            var hasFormula = cellStatus.Element(nsMain + "f") != null;
                            if (hasFormula)
                            {
                                cellStatus.SetAttributeValue("t", "str");
                                var vEl = cellStatus.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                                if (cellStatus.Element(nsMain + "v") == null) cellStatus.Add(vEl);
                                vEl.Value = pag.Status == StatusParcela.Pago ? "PAGO" : "PREVISTO";
                            }
                            else
                            {
                                cellStatus.SetAttributeValue("t", "s");
                                var vEl = cellStatus.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                                if (cellStatus.Element(nsMain + "v") == null) cellStatus.Add(vEl);
                                vEl.Value = pag.Status == StatusParcela.Pago ? idxPago.ToString() : idxPrevisto.ToString();
                            }
                        }
                    }

                    if (!string.IsNullOrEmpty(colValor) && pag.Valor > 0)
                    {
                        var cellValor = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colValor}{rAttr}");
                        if (cellValor != null)
                        {
                            var vEl = cellValor.Element(nsMain + "v");
                            if (vEl == null) { vEl = new XElement(nsMain + "v"); cellValor.Add(vEl); }
                            vEl.Value = ((double)pag.Valor).ToString(CultureInfo.InvariantCulture);
                        }
                    }

                    var cellData = !string.IsNullOrEmpty(colData) ? row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colData}{rAttr}") : null;
                    var cellDia = !string.IsNullOrEmpty(colDia) ? row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colDia}{rAttr}") : null;
                    var cellMes = !string.IsNullOrEmpty(colMes) ? row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colMes}{rAttr}") : null;
                    var cellAno = !string.IsNullOrEmpty(colAno) ? row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colAno}{rAttr}") : null;

                    if (pag.Status == StatusParcela.Pago && !string.IsNullOrWhiteSpace(pag.DataPagamento) &&
                        DateTime.TryParseExact(pag.DataPagamento, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtPag))
                    {
                        var oaDate = dtPag.ToOADate();
                        if (cellData != null)
                        {
                            cellData.Attribute("t")?.Remove();
                            var vEl = cellData.Element(nsMain + "v");
                            if (vEl == null) { vEl = new XElement(nsMain + "v"); cellData.Add(vEl); }
                            vEl.Value = ((int)oaDate).ToString();
                        }
                        if (cellDia != null)
                        {
                            cellDia.SetAttributeValue("t", "str");
                            var vEl = cellDia.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellDia.Element(nsMain + "v") == null) cellDia.Add(vEl);
                            vEl.Value = dtPag.Day.ToString("00");
                        }
                        if (cellMes != null)
                        {
                            cellMes.SetAttributeValue("t", "str");
                            var vEl = cellMes.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellMes.Element(nsMain + "v") == null) cellMes.Add(vEl);
                            vEl.Value = mesesPt[dtPag.Month];
                        }
                        if (cellAno != null)
                        {
                            cellAno.Attribute("t")?.Remove();
                            var vEl = cellAno.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellAno.Element(nsMain + "v") == null) cellAno.Add(vEl);
                            vEl.Value = dtPag.Year.ToString();
                        }
                    }
                    else
                    {
                        cellData?.Element(nsMain + "v")?.Remove();
                        cellDia?.Element(nsMain + "v")?.Remove();
                        cellMes?.Element(nsMain + "v")?.Remove();
                        cellAno?.Element(nsMain + "v")?.Remove();
                    }

                    if (!string.IsNullOrEmpty(colDataPrev) && !string.IsNullOrWhiteSpace(pag.DataPrevista) &&
                        DateTime.TryParseExact(pag.DataPrevista, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtPrev))
                    {
                        var cellG = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colDataPrev}{rAttr}");
                        if (cellG != null)
                        {
                            var oaPrev = (int)dtPrev.ToOADate();
                            var vEl = cellG.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellG.Element(nsMain + "v") == null) cellG.Add(vEl);
                            vEl.Value = oaPrev.ToString();
                        }
                    }
                }

                bool isPago = false;
                if (!string.IsNullOrEmpty(colData))
                {
                    var cData = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colData}{rAttr}");
                    if (cData?.Element(nsMain + "v") != null && !string.IsNullOrWhiteSpace(cData.Element(nsMain + "v")?.Value))
                    {
                        isPago = true;
                    }
                }
                else if (!string.IsNullOrEmpty(colStatus))
                {
                    var cStatus = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colStatus}{rAttr}");
                    if (cStatus != null)
                    {
                        var sVal = cStatus.Element(nsMain + "v")?.Value;
                        if (string.Equals(sVal, "PAGO", StringComparison.OrdinalIgnoreCase) || sVal == idxPago.ToString() || sVal == "3") isPago = true;
                    }
                }

                decimal rowValorDec = 0m;
                if (!string.IsNullOrEmpty(colValor))
                {
                    var cValor = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colValor}{rAttr}");
                    if (cValor != null)
                    {
                        var vVal = cValor.Element(nsMain + "v")?.Value;
                        if (!string.IsNullOrEmpty(vVal) && decimal.TryParse(vVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedVal))
                        {
                            rowValorDec = parsedVal;
                        }
                    }
                }

                var cellSaldo = !string.IsNullOrEmpty(colSaldo)
                    ? row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"{colSaldo}{rAttr}")
                    : null;

                parcelasData.Add(new RowParcelaInfo(rowNome, rowParcela, isPago, rowValorDec, cellSaldo));
            }

            var totalContratoPorBen = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var pagoPorBen = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

            foreach (var g in parcelasData.GroupBy(p => p.Nome, StringComparer.OrdinalIgnoreCase))
            {
                decimal acumuladoPago = 0m;
                decimal contratoBen = 30000m;
                totalContratoPorBen[g.Key] = contratoBen;

                foreach (var item in g.OrderBy(x => x.Parcela))
                {
                    if (item.IsPago)
                    {
                        acumuladoPago += item.Valor;
                    }
                    var saldoRestante = contratoBen - acumuladoPago;
                    if (item.CellSaldo != null)
                    {
                        var vEl = item.CellSaldo.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                        if (item.CellSaldo.Element(nsMain + "v") == null) item.CellSaldo.Add(vEl);
                        vEl.Value = ((double)saldoRestante).ToString(CultureInfo.InvariantCulture);
                    }
                }
                pagoPorBen[g.Key] = acumuladoPago;
            }

            var xmlSettings = new System.Xml.XmlWriterSettings 
            { 
                OmitXmlDeclaration = false, 
                Encoding = new System.Text.UTF8Encoding(false), 
                Indent = false 
            };

            sheet2Entry.Delete();
            var newSheet2Entry = archive.CreateEntry("xl/worksheets/sheet2.xml", CompressionLevel.Optimal);
            using (var outS2 = newSheet2Entry.Open())
            using (var writer = System.Xml.XmlWriter.Create(outS2, xmlSettings))
            {
                sheet2Doc.Save(writer);
            }

            // 3. Atualizar sheet1.xml (Controle Geral)
            var sheet1Entry = archive.GetEntry("xl/worksheets/sheet1.xml");
            if (sheet1Entry != null)
            {
                XDocument sheet1Doc;
                using (var s1Stream = sheet1Entry.Open())
                {
                    sheet1Doc = XDocument.Load(s1Stream);
                }

                var s1Data = sheet1Doc.Root?.Element(nsMain + "sheetData");
                if (s1Data != null)
                {
                    var s1Rows = s1Data.Elements(nsMain + "row").ToList();

                    void UpdateGeralRow(string rowNum, string benNome)
                    {
                        var s1Row = s1Rows.FirstOrDefault(r => r.Attribute("r")?.Value == rowNum);
                        if (s1Row == null) return;

                        var pago = pagoPorBen.GetValueOrDefault(benNome, 0m);
                        var contrato = totalContratoPorBen.GetValueOrDefault(benNome, 30000m);
                        var saldo = contrato - pago;
                        var status = saldo <= 0 ? "QUITADO" : "EM ABERTO";

                        var cD = s1Row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"D{rowNum}");
                        if (cD != null)
                        {
                            var vEl = cD.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cD.Element(nsMain + "v") == null) cD.Add(vEl);
                            vEl.Value = ((double)pago).ToString(CultureInfo.InvariantCulture);
                        }

                        var cE = s1Row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"E{rowNum}");
                        if (cE != null)
                        {
                            var vEl = cE.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cE.Element(nsMain + "v") == null) cE.Add(vEl);
                            vEl.Value = ((double)saldo).ToString(CultureInfo.InvariantCulture);
                        }

                        var cF = s1Row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"F{rowNum}");
                        if (cF != null)
                        {
                            cF.SetAttributeValue("t", "str");
                            var vEl = cF.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cF.Element(nsMain + "v") == null) cF.Add(vEl);
                            vEl.Value = status;
                        }
                    }

                    UpdateGeralRow("2", "ELIANE MARIA DA SILVA");
                    UpdateGeralRow("3", "ELINALDO MARQUES DA SILVA");
                    UpdateGeralRow("4", "ELISANGELA MARIA VASCONCELOS DE ARAÚJO");

                    decimal totalContratoGlobal = totalContratoPorBen.Values.Sum();
                    if (totalContratoGlobal <= 0) totalContratoGlobal = 90000m;
                    decimal totalPagoGlobal = pagoPorBen.Values.Sum();
                    decimal totalSaldoGlobal = totalContratoGlobal - totalPagoGlobal;

                    double pctRealizado = totalContratoGlobal > 0 ? (double)(totalPagoGlobal / totalContratoGlobal) : 0.0;
                    double pctComprometido = totalContratoGlobal > 0 ? (double)(totalSaldoGlobal / totalContratoGlobal) : 0.0;

                    var r8 = s1Rows.FirstOrDefault(r => r.Attribute("r")?.Value == "8");
                    if (r8 != null)
                    {
                        var b8 = r8.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == "B8");
                        if (b8 != null)
                        {
                            var v = b8.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (b8.Element(nsMain + "v") == null) b8.Add(v);
                            v.Value = ((double)totalContratoGlobal).ToString(CultureInfo.InvariantCulture);
                        }
                    }

                    var r9 = s1Rows.FirstOrDefault(r => r.Attribute("r")?.Value == "9");
                    if (r9 != null)
                    {
                        var b9 = r9.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == "B9");
                        if (b9 != null)
                        {
                            var v = b9.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (b9.Element(nsMain + "v") == null) b9.Add(v);
                            v.Value = ((double)totalPagoGlobal).ToString(CultureInfo.InvariantCulture);
                        }
                        var c9 = r9.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == "C9");
                        if (c9 != null)
                        {
                            var v = c9.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (c9.Element(nsMain + "v") == null) c9.Add(v);
                            v.Value = pctRealizado.ToString("0.################", CultureInfo.InvariantCulture);
                        }
                    }

                    var r10 = s1Rows.FirstOrDefault(r => r.Attribute("r")?.Value == "10");
                    if (r10 != null)
                    {
                        var b10 = r10.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == "B10");
                        if (b10 != null)
                        {
                            var v = b10.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (b10.Element(nsMain + "v") == null) b10.Add(v);
                            v.Value = ((double)totalSaldoGlobal).ToString(CultureInfo.InvariantCulture);
                        }
                        var c10 = r10.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == "C10");
                        if (c10 != null)
                        {
                            var v = c10.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (c10.Element(nsMain + "v") == null) c10.Add(v);
                            v.Value = pctComprometido.ToString("0.################", CultureInfo.InvariantCulture);
                        }
                    }

                    sheet1Entry.Delete();
                    var newSheet1Entry = archive.CreateEntry("xl/worksheets/sheet1.xml", CompressionLevel.Optimal);
                    using (var outS1 = newSheet1Entry.Open())
                    using (var writer = System.Xml.XmlWriter.Create(outS1, xmlSettings))
                    {
                        sheet1Doc.Save(writer);
                    }

                    // 4. Atualizar chart1.xml
                    var chartEntry = archive.GetEntry("xl/charts/chart1.xml");
                    if (chartEntry != null)
                    {
                        XDocument chartDoc;
                        using (var chStream = chartEntry.Open())
                        {
                            chartDoc = XDocument.Load(chStream);
                        }

                        var numRefs = chartDoc.Descendants(nsChart + "numRef").ToList();
                        foreach (var nr in numRefs)
                        {
                            var f = nr.Element(nsChart + "f")?.Value;
                            if (f != null && f.Contains("$B$9:$B$10"))
                            {
                                var pts = nr.Element(nsChart + "numCache")?.Elements(nsChart + "pt").ToList();
                                if (pts != null)
                                {
                                    var pt0 = pts.FirstOrDefault(p => p.Attribute("idx")?.Value == "0");
                                    var pt1 = pts.FirstOrDefault(p => p.Attribute("idx")?.Value == "1");
                                    if (pt0?.Element(nsChart + "v") != null)
                                        pt0.Element(nsChart + "v")!.Value = ((double)totalPagoGlobal).ToString(CultureInfo.InvariantCulture);
                                    if (pt1?.Element(nsChart + "v") != null)
                                        pt1.Element(nsChart + "v")!.Value = ((double)totalSaldoGlobal).ToString(CultureInfo.InvariantCulture);
                                }
                            }
                            else if (f != null && f.Contains("$C$9:$C$10"))
                            {
                                var pts = nr.Element(nsChart + "numCache")?.Elements(nsChart + "pt").ToList();
                                if (pts != null)
                                {
                                    var pt0 = pts.FirstOrDefault(p => p.Attribute("idx")?.Value == "0");
                                    var pt1 = pts.FirstOrDefault(p => p.Attribute("idx")?.Value == "1");
                                    if (pt0?.Element(nsChart + "v") != null)
                                        pt0.Element(nsChart + "v")!.Value = pctRealizado.ToString("0.################", CultureInfo.InvariantCulture);
                                    if (pt1?.Element(nsChart + "v") != null)
                                        pt1.Element(nsChart + "v")!.Value = pctComprometido.ToString("0.################", CultureInfo.InvariantCulture);
                                }
                            }
                        }

                        chartEntry.Delete();
                        var newChartEntry = archive.CreateEntry("xl/charts/chart1.xml", CompressionLevel.Optimal);
                        using (var outCh = newChartEntry.Open())
                        using (var writer = System.Xml.XmlWriter.Create(outCh, xmlSettings))
                        {
                            chartDoc.Save(writer);
                        }
                    }
                }
            }
        }

        return memoryStream.ToArray();
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
