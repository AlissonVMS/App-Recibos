using System.Globalization;

namespace AppRecibos.Core.Services;

public static class NumberToWordsPtBr
{
    private static readonly string[] Unidades =
    [
        "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
        "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete",
        "dezoito", "dezenove"
    ];

    private static readonly string[] Dezenas =
    [
        "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta",
        "oitenta", "noventa"
    ];

    private static readonly string[] Centenas =
    [
        "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos",
        "setecentos", "oitocentos", "novecentos"
    ];

    public static readonly string[] MesesPtBr =
    [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    private static string ConverterGrupo(long num)
    {
        if (num == 0) return string.Empty;
        if (num == 100) return "cem";

        var c = (int)(num / 100);
        var d = (int)((num % 100) / 10);
        var u = (int)(num % 10);
        var parts = new List<string>();

        if (c > 0)
        {
            parts.Add(Centenas[c]);
        }

        var resto = (int)(num % 100);
        if (resto > 0)
        {
            if (resto < 20)
            {
                parts.Add(Unidades[resto]);
            }
            else
            {
                parts.Add(Dezenas[d]);
                if (u > 0)
                {
                    parts.Add(Unidades[u]);
                }
            }
        }

        return string.Join(" e ", parts);
    }

    public static string ValorPorExtenso(decimal valor)
    {
        if (valor == 0) return "zero reais";

        var positivo = Math.Abs(valor);
        var inteiro = (long)Math.Floor(positivo);
        var centavos = (int)Math.Round((positivo - inteiro) * 100);

        var milhoes = inteiro / 1_000_000;
        var milhares = (inteiro % 1_000_000) / 1_000;
        var unidades = inteiro % 1_000;

        var partes = new List<string>();

        if (milhoes > 0)
        {
            partes.Add(milhoes == 1 ? "um milhão" : $"{ConverterGrupo(milhoes)} milhões");
        }

        if (milhares > 0)
        {
            partes.Add(milhares == 1 ? "mil" : $"{ConverterGrupo(milhares)} mil");
        }

        if (unidades > 0)
        {
            partes.Add(ConverterGrupo(unidades));
        }

        string textoReais = string.Empty;
        if (inteiro > 0)
        {
            var nomeReais = inteiro == 1 ? "real" : "reais";
            textoReais = $"{string.Join(" e ", partes)} {nomeReais}";
        }

        string textoCentavos = string.Empty;
        if (centavos > 0)
        {
            var nomeCentavos = centavos == 1 ? "centavo" : "centavos";
            textoCentavos = $"{ConverterGrupo(centavos)} {nomeCentavos}";
        }

        if (!string.IsNullOrEmpty(textoReais) && !string.IsNullOrEmpty(textoCentavos))
        {
            return $"{textoReais} e {textoCentavos}";
        }
        if (!string.IsNullOrEmpty(textoReais))
        {
            return textoReais;
        }
        if (!string.IsNullOrEmpty(textoCentavos))
        {
            return textoCentavos;
        }

        return "zero reais";
    }

    public static string FormatarNumeroMoeda(decimal valor)
    {
        return valor.ToString("N2", new CultureInfo("pt-BR"));
    }

    public static string FormatarMoedaComCifrao(decimal valor)
    {
        return $"R$ {FormatarNumeroMoeda(valor)}";
    }

    public static string FormatarDataPtBr(string? dataStr)
    {
        if (string.IsNullOrWhiteSpace(dataStr)) return string.Empty;
        if (DateTime.TryParse(dataStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) ||
            DateTime.TryParse(dataStr, new CultureInfo("pt-BR"), DateTimeStyles.None, out dt))
        {
            return dt.ToString("dd/MM/yyyy");
        }
        return dataStr;
    }
}
