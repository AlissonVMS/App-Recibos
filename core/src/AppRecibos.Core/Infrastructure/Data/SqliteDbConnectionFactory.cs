using System.Data;
using Microsoft.Data.Sqlite;

namespace AppRecibos.Core.Infrastructure.Data;

public class SqliteDbConnectionFactory
{
    private readonly string _connectionString;

    public SqliteDbConnectionFactory(string? dbPath = null)
    {
        if (string.IsNullOrWhiteSpace(dbPath))
        {
            var appDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "app-recibos"
            );
            Directory.CreateDirectory(appDataDir);
            dbPath = Path.Combine(appDataDir, "recibos.db");
        }
        else if (dbPath != ":memory:")
        {
            var dir = Path.GetDirectoryName(dbPath);
            if (!string.IsNullOrWhiteSpace(dir))
            {
                Directory.CreateDirectory(dir);
            }
        }

        _connectionString = dbPath == ":memory:" 
            ? "Data Source=:memory:;Mode=Memory;Cache=Shared" 
            : $"Data Source={dbPath}";
    }

    public IDbConnection CreateConnection()
    {
        var connection = new SqliteConnection(_connectionString);
        connection.Open();
        return connection;
    }

    public void InitializeDatabase()
    {
        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText = @"
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS config_contrato (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                pagador_nome TEXT NOT NULL,
                pagador_cpf TEXT NOT NULL,
                pagador_banco TEXT,
                titulo_contrato TEXT NOT NULL,
                data_contrato TEXT NOT NULL,
                onedrive_excel_path TEXT,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS beneficiarios (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                cpf TEXT NOT NULL UNIQUE,
                contrato_total NUMERIC NOT NULL,
                total_pago NUMERIC NOT NULL DEFAULT 0,
                saldo_devedor NUMERIC NOT NULL,
                status TEXT NOT NULL DEFAULT 'EM ABERTO',
                banco TEXT NOT NULL,
                agencia TEXT,
                conta TEXT,
                operacao TEXT,
                tipo_conta TEXT NOT NULL,
                chave_pix TEXT NOT NULL,
                tipo_chave_pix TEXT,
                cidade_uf TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS pagamentos (
                id TEXT PRIMARY KEY,
                beneficiario_id TEXT NOT NULL,
                beneficiario_nome TEXT NOT NULL,
                beneficiario_cpf TEXT NOT NULL,
                parcela_numero INTEGER NOT NULL,
                valor NUMERIC NOT NULL,
                status TEXT NOT NULL, -- Previsto | Pago
                data_prevista TEXT,
                data_pagamento TEXT,
                forma_pgto TEXT NOT NULL,
                chave_pix TEXT NOT NULL,
                tipo_chave_pix TEXT,
                banco TEXT NOT NULL,
                saldo_apos_parcela NUMERIC NOT NULL,
                dia TEXT,
                mes TEXT,
                ano TEXT,
                cidade_uf TEXT NOT NULL,
                observacoes TEXT,
                FOREIGN KEY(beneficiario_id) REFERENCES beneficiarios(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_pagamentos_beneficiario ON pagamentos(beneficiario_id);
            CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

            CREATE TABLE IF NOT EXISTS bancos_bacen (
                codigo TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                label TEXT NOT NULL,
                ativo INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS sync_historico (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                sucesso INTEGER NOT NULL,
                mensagem TEXT,
                registros_sincronizados INTEGER
            );

            -- Normalização universal de status para maiúsculas (PAGO / PREVISTO)
            UPDATE pagamentos SET status = 'PAGO' WHERE UPPER(status) = 'PAGO' AND status != 'PAGO';
            UPDATE pagamentos SET status = 'PREVISTO' WHERE UPPER(status) = 'PREVISTO' AND status != 'PREVISTO';

            -- Normalização de dia, mês e ano caso estejam nulos e haja data disponível
            UPDATE pagamentos
            SET
                ano = SUBSTR(COALESCE(data_pagamento, data_prevista), 1, 4),
                dia = SUBSTR(COALESCE(data_pagamento, data_prevista), 9, 2),
                mes = CASE SUBSTR(COALESCE(data_pagamento, data_prevista), 6, 2)
                    WHEN '01' THEN 'Janeiro'
                    WHEN '02' THEN 'Fevereiro'
                    WHEN '03' THEN 'Março'
                    WHEN '04' THEN 'Abril'
                    WHEN '05' THEN 'Maio'
                    WHEN '06' THEN 'Junho'
                    WHEN '07' THEN 'Julho'
                    WHEN '08' THEN 'Agosto'
                    WHEN '09' THEN 'Setembro'
                    WHEN '10' THEN 'Outubro'
                    WHEN '11' THEN 'Novembro'
                    WHEN '12' THEN 'Dezembro'
                    ELSE mes
                END
            WHERE (dia IS NULL OR mes IS NULL OR ano IS NULL OR TRIM(dia) = '' OR TRIM(mes) = '' OR TRIM(ano) = '')
              AND (data_pagamento IS NOT NULL OR data_prevista IS NOT NULL);
        ";
        command.ExecuteNonQuery();
    }
}
