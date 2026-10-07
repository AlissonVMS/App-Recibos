using System.Text.Json.Serialization;

namespace AppRecibos.Core.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StatusParcela
{
    Previsto,
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
