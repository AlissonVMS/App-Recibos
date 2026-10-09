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

    private sealed record RowParcelaInfo(string Nome, int Parcela, bool IsPago, decimal Valor, XElement? CellK);

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
                    var cellD = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"D{rAttr}");
                    if (cellD != null)
                    {
                        cellD.SetAttributeValue("t", "s");
                        var vEl = cellD.Element(nsMain + "v");
                        if (vEl == null) { vEl = new XElement(nsMain + "v"); cellD.Add(vEl); }
                        vEl.Value = pag.Status == StatusParcela.Pago ? idxPago.ToString() : idxPrevisto.ToString();
                    }

                    if (pag.Valor > 0)
                    {
                        var cellE = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"E{rAttr}");
                        if (cellE != null)
                        {
                            var vEl = cellE.Element(nsMain + "v");
                            if (vEl == null) { vEl = new XElement(nsMain + "v"); cellE.Add(vEl); }
                            vEl.Value = ((double)pag.Valor).ToString(CultureInfo.InvariantCulture);
                        }
                    }

                    var cellF = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"F{rAttr}");
                    var cellL = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"L{rAttr}");
                    var cellM = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"M{rAttr}");
                    var cellN = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"N{rAttr}");

                    if (pag.Status == StatusParcela.Pago && !string.IsNullOrWhiteSpace(pag.DataPagamento) &&
                        DateTime.TryParseExact(pag.DataPagamento, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtPag))
                    {
                        var oaDate = dtPag.ToOADate();
                        if (cellF != null)
                        {
                            cellF.Attribute("t")?.Remove();
                            var vEl = cellF.Element(nsMain + "v");
                            if (vEl == null) { vEl = new XElement(nsMain + "v"); cellF.Add(vEl); }
                            vEl.Value = ((int)oaDate).ToString();
                        }
                        if (cellL != null)
                        {
                            cellL.SetAttributeValue("t", "str");
                            var vEl = cellL.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellL.Element(nsMain + "v") == null) cellL.Add(vEl);
                            vEl.Value = dtPag.Day.ToString("00");
                        }
                        if (cellM != null)
                        {
                            cellM.SetAttributeValue("t", "str");
                            var vEl = cellM.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellM.Element(nsMain + "v") == null) cellM.Add(vEl);
                            vEl.Value = mesesPt[dtPag.Month];
                        }
                        if (cellN != null)
                        {
                            cellN.Attribute("t")?.Remove();
                            var vEl = cellN.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellN.Element(nsMain + "v") == null) cellN.Add(vEl);
                            vEl.Value = dtPag.Year.ToString();
                        }
                    }
                    else
                    {
                        cellF?.Element(nsMain + "v")?.Remove();
                        cellL?.Element(nsMain + "v")?.Remove();
                        cellM?.Element(nsMain + "v")?.Remove();
                        cellN?.Element(nsMain + "v")?.Remove();
                    }

                    if (!string.IsNullOrWhiteSpace(pag.DataPrevista) &&
                        DateTime.TryParseExact(pag.DataPrevista, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtPrev))
                    {
                        var cellG = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"G{rAttr}");
                        if (cellG != null)
                        {
                            var oaPrev = (int)dtPrev.ToOADate();
                            var vEl = cellG.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                            if (cellG.Element(nsMain + "v") == null) cellG.Add(vEl);
                            vEl.Value = oaPrev.ToString();
                        }
                    }
                }

                var cStatus = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"D{rAttr}");
                var cValor = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"E{rAttr}");
                var cellK = row.Elements(nsMain + "c").FirstOrDefault(c => c.Attribute("r")?.Value == $"K{rAttr}");

                bool isPago = false;
                if (cStatus != null)
                {
                    var sVal = cStatus.Element(nsMain + "v")?.Value;
                    if (sVal == idxPago.ToString() || sVal == "3") isPago = true;
                }

                decimal rowValorDec = 0m;
                if (cValor != null)
                {
                    var vVal = cValor.Element(nsMain + "v")?.Value;
                    if (!string.IsNullOrEmpty(vVal) && decimal.TryParse(vVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedVal))
                    {
                        rowValorDec = parsedVal;
                    }
                }

                parcelasData.Add(new RowParcelaInfo(rowNome, rowParcela, isPago, rowValorDec, cellK));
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
                    if (item.CellK != null)
                    {
                        var vEl = item.CellK.Element(nsMain + "v") ?? new XElement(nsMain + "v");
                        if (item.CellK.Element(nsMain + "v") == null) item.CellK.Add(vEl);
                        vEl.Value = ((double)saldoRestante).ToString(CultureInfo.InvariantCulture);
                    }
                }
                pagoPorBen[g.Key] = acumuladoPago;
            }

            sheet2Entry.Delete();
            var newSheet2Entry = archive.CreateEntry("xl/worksheets/sheet2.xml", CompressionLevel.Optimal);
            using (var outS2 = newSheet2Entry.Open())
            {
                sheet2Doc.Save(outS2);
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
                    {
                        sheet1Doc.Save(outS1);
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
                        {
                            chartDoc.Save(outCh);
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
