# Normatização BACEN STR

Para assegurar total precisão cadastral e conformidade com as regras do **Banco Central do Brasil**, o App-Recibos integra a base oficial de participantes do **Sistema de Transferência de Reservas (STR)**.

## Critérios de Padronização

### 1. Ingestão e Filtragem de Dados
- **Fonte Oficial**: Catálogo `ParticipantesSTR.csv` emitido pelo Banco Central.
- **Participantes Válidos**: Filtra apenas instituições financeiras ativas com código COMPE numérico atribuído (`001` a `804`), totalizando **322 instituições homologadas**.
- **Ordenação**: Ordem estritamente crescente pelo código de compensação bancária de 3 dígitos (ex: `001`, `033`, `104`, `237`, `260`, `341`, `804`).

### 2. Formatação Title Case
Ao contrário de bases brutas que apresentam nomes em caixa alta truncada (ex: `BANCO BRADESCO S.A.` ou `NU PAGAMENTOS - IP S.A.`), o App-Recibos padroniza a apresentação visual:
- Preserva siglas societárias reconhecidas (`S.A.`, `BCO`, `CFI`, `DTVM`).
- Converte nomes próprios e conectivos de acordo com a norma culta da língua portuguesa:
  - `001 - Banco do Brasil S.A.`
  - `104 - Caixa Econômica Federal`
  - `237 - Banco Bradesco S.A.`
  - `260 - Nu Pagamentos S.A.`
  - `341 - Itaú Unibanco S.A.`

### 3. Regra de Ouro: Purificação para Recibos Civis

No ambiente de sistema e no controle interno (tabelas e telas de seleção), a exibição do banco inclui o código COMPE para facilitar a busca do operador:
> `260 - Nu Pagamentos S.A.`

No entanto, no **recibo civil oficial de quitação plena**, exigências jurídicas determinam que o documento não contenha códigos numéricos de compensação nem apelidos comerciais entre parênteses:
- ❌ **Incorreto no Recibo**: `260 - Nu Pagamentos S.A. (Nubank)`
- ❌ **Incorreto no Recibo**: `104 - Caixa Econômica Federal`
- ✅ **Correto no Recibo**: `Nu Pagamentos S.A.`
- ✅ **Correto no Recibo**: `Caixa Econômica Federal`

### Implementação da Purificação (`ExtrairNomePuroBanco`)

No backend C# e frontend TypeScript, a regra é executada por expressão regular:

```csharp
public static string ExtrairNomePuroBanco(string? banco)
{
    if (string.IsNullOrWhiteSpace(banco)) return string.Empty;
    var limpo = banco.Trim();

    // 1. Remove prefixo numérico COMPE: "260 - " -> ""
    limpo = Regex.Replace(limpo, @"^\d+\s*[-–—]\s*", "");

    // 2. Remove apelidos entre parênteses: " (Nubank)" -> ""
    limpo = Regex.Replace(limpo, @"\s*\([^)]*\)", "");

    return limpo.Trim();
}
```
