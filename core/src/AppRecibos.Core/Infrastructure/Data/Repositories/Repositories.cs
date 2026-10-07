using System.Data;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using Dapper;

namespace AppRecibos.Core.Infrastructure.Data.Repositories;

public class ContratoRepository
{
    private readonly SqliteDbConnectionFactory _factory;

    public ContratoRepository(SqliteDbConnectionFactory factory) => _factory = factory;

    public async Task<ContratoConfig?> GetAsync()
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT 
                id AS Id,
                pagador_nome AS PagadorNome,
                pagador_cpf AS PagadorCpf,
                pagador_banco AS PagadorBanco,
                titulo_contrato AS TituloContrato,
                data_contrato AS DataContrato,
                onedrive_excel_path AS OnedriveExcelPath,
                updated_at AS UpdatedAt
            FROM config_contrato WHERE id = 1 LIMIT 1;";
        return await conn.QuerySingleOrDefaultAsync<ContratoConfig>(sql);
    }

    public async Task SaveAsync(ContratoConfig config)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            INSERT INTO config_contrato (id, pagador_nome, pagador_cpf, pagador_banco, titulo_contrato, data_contrato, onedrive_excel_path, updated_at)
            VALUES (1, @PagadorNome, @PagadorCpf, @PagadorBanco, @TituloContrato, @DataContrato, @OnedriveExcelPath, @UpdatedAt)
            ON CONFLICT(id) DO UPDATE SET
                pagador_nome = excluded.pagador_nome,
                pagador_cpf = excluded.pagador_cpf,
                pagador_banco = excluded.pagador_banco,
                titulo_contrato = excluded.titulo_contrato,
                data_contrato = excluded.data_contrato,
                onedrive_excel_path = excluded.onedrive_excel_path,
                updated_at = excluded.updated_at;";
        await conn.ExecuteAsync(sql, config);
    }
}

public class BeneficiarioRepository
{
    private readonly SqliteDbConnectionFactory _factory;

    public BeneficiarioRepository(SqliteDbConnectionFactory factory) => _factory = factory;

    public async Task<IReadOnlyList<Beneficiario>> GetAllAsync()
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT 
                id AS Id,
                nome AS Nome,
                cpf AS Cpf,
                contrato_total AS ContratoTotal,
                total_pago AS TotalPago,
                saldo_devedor AS SaldoDevedor,
                status AS Status,
                banco AS Banco,
                agencia AS Agencia,
                conta AS Conta,
                operacao AS Operacao,
                tipo_conta AS TipoConta,
                chave_pix AS ChavePix,
                tipo_chave_pix AS TipoChavePix,
                cidade_uf AS CidadeUf
            FROM beneficiarios ORDER BY nome ASC;";
        var list = await conn.QueryAsync<Beneficiario>(sql);
        return list.ToList();
    }

    public async Task<Beneficiario?> GetByIdAsync(string id)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT 
                id AS Id,
                nome AS Nome,
                cpf AS Cpf,
                contrato_total AS ContratoTotal,
                total_pago AS TotalPago,
                saldo_devedor AS SaldoDevedor,
                status AS Status,
                banco AS Banco,
                agencia AS Agencia,
                conta AS Conta,
                operacao AS Operacao,
                tipo_conta AS TipoConta,
                chave_pix AS ChavePix,
                tipo_chave_pix AS TipoChavePix,
                cidade_uf AS CidadeUf
            FROM beneficiarios WHERE id = @Id;";
        return await conn.QuerySingleOrDefaultAsync<Beneficiario>(sql, new { Id = id });
    }

    public async Task SaveAsync(Beneficiario b)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            INSERT INTO beneficiarios (id, nome, cpf, contrato_total, total_pago, saldo_devedor, status, banco, agencia, conta, operacao, tipo_conta, chave_pix, tipo_chave_pix, cidade_uf)
            VALUES (@Id, @Nome, @Cpf, @ContratoTotal, @TotalPago, @SaldoDevedor, @Status, @Banco, @Agencia, @Conta, @Operacao, @TipoConta, @ChavePix, @TipoChavePix, @CidadeUf)
            ON CONFLICT(id) DO UPDATE SET
                nome = excluded.nome,
                cpf = excluded.cpf,
                contrato_total = excluded.contrato_total,
                total_pago = excluded.total_pago,
                saldo_devedor = excluded.saldo_devedor,
                status = excluded.status,
                banco = excluded.banco,
                agencia = excluded.agencia,
                conta = excluded.conta,
                operacao = excluded.operacao,
                tipo_conta = excluded.tipo_conta,
                chave_pix = excluded.chave_pix,
                tipo_chave_pix = excluded.tipo_chave_pix,
                cidade_uf = excluded.cidade_uf;";
        await conn.ExecuteAsync(sql, b);
    }

    public async Task UpdateSaldoAsync(string id, decimal totalPago, decimal saldoDevedor, string status)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            UPDATE beneficiarios 
            SET total_pago = @TotalPago, saldo_devedor = @SaldoDevedor, status = @Status 
            WHERE id = @Id;";
        await conn.ExecuteAsync(sql, new { Id = id, TotalPago = totalPago, SaldoDevedor = saldoDevedor, Status = status });
    }
}

public class PagamentoRepository
{
    private readonly SqliteDbConnectionFactory _factory;

    public PagamentoRepository(SqliteDbConnectionFactory factory) => _factory = factory;

    public async Task<IReadOnlyList<Pagamento>> GetAllAsync()
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT 
                id AS Id,
                beneficiario_id AS BeneficiarioId,
                beneficiario_nome AS BeneficiarioNome,
                beneficiario_cpf AS BeneficiarioCpf,
                parcela_numero AS ParcelaNumero,
                valor AS Valor,
                status AS Status,
                data_prevista AS DataPrevista,
                data_pagamento AS DataPagamento,
                forma_pgto AS FormaPgto,
                chave_pix AS ChavePix,
                tipo_chave_pix AS TipoChavePix,
                banco AS Banco,
                saldo_apos_parcela AS SaldoAposParcela,
                dia AS Dia,
                mes AS Mes,
                ano AS Ano,
                cidade_uf AS CidadeUf,
                observacoes AS Observacoes
            FROM pagamentos ORDER BY parcela_numero ASC, beneficiario_nome ASC;";
        
        var rows = await conn.QueryAsync(sql);
        return rows.Select(r => new Pagamento
        {
            Id = (string)r.Id,
            BeneficiarioId = (string)r.BeneficiarioId,
            BeneficiarioNome = (string)r.BeneficiarioNome,
            BeneficiarioCpf = (string)r.BeneficiarioCpf,
            ParcelaNumero = (int)(long)r.ParcelaNumero,
            Valor = Convert.ToDecimal(r.Valor),
            Status = Enum.Parse<StatusParcela>((string)r.Status, true),
            DataPrevista = (string?)r.DataPrevista,
            DataPagamento = (string?)r.DataPagamento,
            FormaPgto = (string)r.FormaPgto,
            ChavePix = (string)r.ChavePix,
            TipoChavePix = (string?)r.TipoChavePix,
            Banco = (string)r.Banco,
            SaldoAposParcela = Convert.ToDecimal(r.SaldoAposParcela),
            Dia = (string?)r.Dia,
            Mes = (string?)r.Mes,
            Ano = (string?)r.Ano,
            CidadeUf = (string)r.CidadeUf,
            Observacoes = (string?)r.Observacoes
        }).ToList();
    }

    public async Task<Pagamento?> GetByIdAsync(string id)
    {
        using var conn = _factory.CreateConnection();
        const string sql = "SELECT * FROM pagamentos WHERE id = @Id;";
        var r = await conn.QuerySingleOrDefaultAsync(sql, new { Id = id });
        if (r == null) return null;

        return new Pagamento
        {
            Id = (string)r.id,
            BeneficiarioId = (string)r.beneficiario_id,
            BeneficiarioNome = (string)r.beneficiario_nome,
            BeneficiarioCpf = (string)r.beneficiario_cpf,
            ParcelaNumero = (int)(long)r.parcela_numero,
            Valor = Convert.ToDecimal(r.valor),
            Status = Enum.Parse<StatusParcela>((string)r.status, true),
            DataPrevista = (string?)r.data_prevista,
            DataPagamento = (string?)r.data_pagamento,
            FormaPgto = (string)r.forma_pgto,
            ChavePix = (string)r.chave_pix,
            TipoChavePix = (string?)r.tipo_chave_pix,
            Banco = (string)r.banco,
            SaldoAposParcela = Convert.ToDecimal(r.saldo_apos_parcela),
            Dia = (string?)r.dia,
            Mes = (string?)r.mes,
            Ano = (string?)r.ano,
            CidadeUf = (string)r.cidade_uf,
            Observacoes = (string?)r.observacoes
        };
    }

    public async Task SaveAsync(Pagamento p)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            INSERT INTO pagamentos (
                id, beneficiario_id, beneficiario_nome, beneficiario_cpf, parcela_numero, valor,
                status, data_prevista, data_pagamento, forma_pgto, chave_pix, tipo_chave_pix,
                banco, saldo_apos_parcela, dia, mes, ano, cidade_uf, observacoes
            ) VALUES (
                @Id, @BeneficiarioId, @BeneficiarioNome, @BeneficiarioCpf, @ParcelaNumero, @Valor,
                @StatusStr, @DataPrevista, @DataPagamento, @FormaPgto, @ChavePix, @TipoChavePix,
                @Banco, @SaldoAposParcela, @Dia, @Mes, @Ano, @CidadeUf, @Observacoes
            )
            ON CONFLICT(id) DO UPDATE SET
                beneficiario_nome = excluded.beneficiario_nome,
                beneficiario_cpf = excluded.beneficiario_cpf,
                parcela_numero = excluded.parcela_numero,
                valor = excluded.valor,
                status = excluded.status,
                data_prevista = excluded.data_prevista,
                data_pagamento = excluded.data_pagamento,
                forma_pgto = excluded.forma_pgto,
                chave_pix = excluded.chave_pix,
                tipo_chave_pix = excluded.tipo_chave_pix,
                banco = excluded.banco,
                saldo_apos_parcela = excluded.saldo_apos_parcela,
                dia = excluded.dia,
                mes = excluded.mes,
                ano = excluded.ano,
                cidade_uf = excluded.cidade_uf,
                observacoes = excluded.observacoes;";

        await conn.ExecuteAsync(sql, new
        {
            p.Id,
            p.BeneficiarioId,
            p.BeneficiarioNome,
            p.BeneficiarioCpf,
            p.ParcelaNumero,
            p.Valor,
            StatusStr = p.Status.ToString(),
            p.DataPrevista,
            p.DataPagamento,
            p.FormaPgto,
            p.ChavePix,
            p.TipoChavePix,
            p.Banco,
            p.SaldoAposParcela,
            p.Dia,
            p.Mes,
            p.Ano,
            p.CidadeUf,
            p.Observacoes
        });
    }

    public async Task DeleteAsync(string id)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("DELETE FROM pagamentos WHERE id = @Id;", new { Id = id });
    }
}

public class BacenRepository
{
    private readonly SqliteDbConnectionFactory _factory;

    public BacenRepository(SqliteDbConnectionFactory factory) => _factory = factory;

    public async Task<IReadOnlyList<BancoBacen>> GetAllAsync()
    {
        using var conn = _factory.CreateConnection();
        const string sql = "SELECT codigo AS Codigo, nome AS Nome, label AS Label, ativo AS Ativo FROM bancos_bacen ORDER BY CAST(codigo AS INTEGER) ASC;";
        var list = await conn.QueryAsync<BancoBacen>(sql);
        return list.ToList();
    }

    public async Task<IReadOnlyList<BancoBacen>> SearchAsync(string query)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT codigo AS Codigo, nome AS Nome, label AS Label, ativo AS Ativo 
            FROM bancos_bacen 
            WHERE nome LIKE @Q OR codigo LIKE @Q 
            ORDER BY CAST(codigo AS INTEGER) ASC 
            LIMIT 50;";
        var list = await conn.QueryAsync<BancoBacen>(sql, new { Q = $"%{query}%" });
        return list.ToList();
    }

    public async Task SaveBatchAsync(IEnumerable<BancoBacen> bancos)
    {
        using var conn = _factory.CreateConnection();
        using var trans = conn.BeginTransaction();
        const string sql = @"
            INSERT INTO bancos_bacen (codigo, nome, label, ativo)
            VALUES (@Codigo, @Nome, @Label, @Ativo)
            ON CONFLICT(codigo) DO UPDATE SET
                nome = excluded.nome,
                label = excluded.label,
                ativo = excluded.ativo;";
        await conn.ExecuteAsync(sql, bancos, trans);
        trans.Commit();
    }
}
