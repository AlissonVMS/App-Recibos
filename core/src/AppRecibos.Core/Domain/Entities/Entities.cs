using AppRecibos.Core.Domain.Enums;

namespace AppRecibos.Core.Domain.Entities;

public sealed record ContratoConfig
{
    public int Id { get; init; } = 1;
    public required string PagadorNome { get; init; }
    public required string PagadorCpf { get; init; }
    public string? PagadorBanco { get; init; }
    public required string TituloContrato { get; init; }
    public required string DataContrato { get; init; }
    public string? OnedriveExcelPath { get; init; }
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
}

public sealed record Beneficiario
{
    public required string Id { get; init; }
    public required string Nome { get; init; }
    public required string Cpf { get; init; }
    public decimal ContratoTotal { get; init; }
    public decimal TotalPago { get; init; }
    public decimal SaldoDevedor { get; init; }
    public required string Status { get; init; } = "EM ABERTO"; // EM ABERTO | QUITADO
    public required string Banco { get; init; }
    public string? Agencia { get; init; }
    public string? Conta { get; init; }
    public string? Operacao { get; init; }
    public required string TipoConta { get; init; } // POUPANÇA | CORRENTE
    public required string ChavePix { get; init; }
    public string? TipoChavePix { get; init; }
    public required string CidadeUf { get; init; }
}

public sealed record Pagamento
{
    public required string Id { get; init; }
    public required string BeneficiarioId { get; init; }
    public required string BeneficiarioNome { get; init; }
    public required string BeneficiarioCpf { get; init; }
    public int ParcelaNumero { get; init; }
    public decimal Valor { get; init; }
    public StatusParcela Status { get; init; } // Previsto | Pago
    public string? DataPrevista { get; init; }
    public string? DataPagamento { get; init; }
    public required string FormaPgto { get; init; } // PIX | TEV
    public required string ChavePix { get; init; }
    public string? TipoChavePix { get; init; }
    public required string Banco { get; init; }
    public decimal SaldoAposParcela { get; init; }
    public string? Dia { get; init; }
    public string? Mes { get; init; }
    public string? Ano { get; init; }
    public required string CidadeUf { get; init; }
    public string? Observacoes { get; init; }
}

public sealed record BancoBacen
{
    public required string Codigo { get; init; }
    public required string Nome { get; init; }
    public required string Label { get; init; }
    public bool Ativo { get; init; } = true;
}

public sealed record SyncHistorico
{
    public int Id { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public bool Sucesso { get; init; }
    public string? Mensagem { get; init; }
    public int RegistrosSincronizados { get; init; }
}
