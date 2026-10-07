using System.Text.Json.Serialization;

namespace AppRecibos.Core.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StatusParcela
{
    [JsonStringEnumMemberName("PREVISTO")]
    Previsto,
    [JsonStringEnumMemberName("PAGO")]
    Pago
}

public enum FormaPagamento
{
    Pix,
    Tev
}

public enum TipoConta
{
    Poupanca,
    Corrente
}

public enum TipoChavePix
{
    Cpf,
    Telefone,
    Email,
    Cnpj,
    Aleatoria
}
