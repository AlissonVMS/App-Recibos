# Estrutura da Planilha Excel

A planilha `CONTROLE PAGAMENTOS.xlsx` é a principal ferramenta legada do usuário para acompanhamento do acordo. O **App-Recibos** opera com garantia de **zero quebra de estrutura** e **preservação total de gráficos e fórmulas**.

## Abas e Tabelas Estruturadas

### Aba 1: `Controle Geral`
Contém a tabela estruturada `GERAL` com o resumo consolidado de cada beneficiário:

| Coluna | Descrição | Exemplo de Conteúdo |
| :--- | :--- | :--- |
| `NOME` | Nome completo do herdeiro | ELISANGELA MARIA VASCONCELOS DE ARAÚJO |
| `CPF` | Documento do herdeiro | `341.267.018-93` |
| `CONTRATO` | Valor total acordado | `30000.00` |
| `PAGO` | Soma calculada das parcelas pagas | `=SUMIF(PARCELAS[NOME], GERAL[@NOME], PARCELAS[VALOR])` |
| `SALDO` | Saldo devedor dinâmico restante | `=GERAL[@CONTRATO] - GERAL[@PAGO]` |
| `STATUS` | Status da quitação total | `=IF(GERAL[@SALDO]<=0, "QUITADO", "EM ABERTO")` |
| `BANCO` | Instituição financeira | `104 - Caixa Econômica Federal` |
| `AG` | Agência bancária | `0001` |
| `CONTA` | Número da conta bancária | `123456-7` |
| `OP` | Operação (se aplicável) | `013` |
| `TIPO` | Tipo de conta | `CORRENTE` ou `POUPANÇA` |
| `PIX` | Chave Pix cadastrada | `(82)99929-1488` |

### Aba 2: `Registro de Pagamentos`
Contém a tabela estruturada `PARCELAS` (colunas A a O) e a tabela auxiliar de meses `MESES` (colunas Q e R):

| Coluna | Cabeçalho | Tipo / Fórmula |
| :---: | :--- | :--- |
| **A** | `NOME` | Texto do beneficiário |
| **B** | `CPF` | `=IFERROR(INDEX(GERAL[CPF],MATCH(PARCELAS[[#This Row],[NOME]],GERAL[NOME],0)),"-")` |
| **C** | `PARCELA` | `=COUNTIF(PARCELAS[[#Headers],[NOME]]:PARCELAS[[#This Row],[NOME]],PARCELAS[[#This Row],[NOME]])` |
| **D** | `STATUS` | `PAGO` ou `PREVISTO` |
| **E** | `VALOR` | Valor da parcela (ex: `1000.00` ou `500.00`) |
| **F** | `DATA PREVISTA` | Data agendada da parcela no formato de data do Excel |
| **G** | `DATA PAGAMENTO` | Data de quitação efetiva (preenchida apenas quando `STATUS` for `PAGO`) |
| **H** | `FORMA PGTO` | `PIX`, `TED`, `TEV` ou `ESPÉCIE` |
| **I** | `CHAVE PIX` | `=IFERROR(INDEX(GERAL[PIX],MATCH(PARCELAS[[#This Row],[NOME]],GERAL[NOME],0)),"-")` |
| **J** | `BANCO` | `=IFERROR(INDEX(GERAL[BANCO],MATCH(PARCELAS[[#This Row],[NOME]],GERAL[NOME],0)),"-")` |
| **K** | `SALDO DEVEDOR`| Fórmula dinâmica de amortização progressiva |
| **L** | `DIA` | `=IF(OR(ISBLANK(...), DAY(...)=0), "", TEXT(DAY(...), "00"))` |
| **M** | `MÊS` | `=IF(ISBLANK(...), "", INDEX(MESES[MÊS], MATCH(MONTH(...), MESES[N], 0)))` |
| **N** | `ANO` | `=IF(OR(ISBLANK(...), YEAR(...)=1900), "", YEAR(...))` |
| **O** | `CIDADE / UF` | `Maceió - AL` ou `Barra de São Miguel - AL` |

## Tabela Auxiliar: `MESES` (Colunas Q e R)
Para desobstruir a linha de visualização principal e garantir compatibilidade com versões antigas do Excel que não suportam a função `TEXT(data, "mmmm")` em português, a tabela `MESES` foi alocada no intervalo `Q1:R13`:
- Coluna Q (`N`): 1 a 12
- Coluna R (`MÊS`): janeiro, fevereiro, março, ..., dezembro

## Proteção Contra Corrupção de Gráfico (`chart1.xml`)
Ao salvar a pasta de trabalho com o **ClosedXML**:
- O arquivo é copiado para um buffer em memória (`byte[]`).
- As alterações de células afetam estritamente os nós XML necessários (`sheet2.xml`).
- Todos os arquivos auxiliares do pacote OpenXML (`xl/drawings/drawing1.xml`, `xl/charts/chart1.xml`, `xl/calcChain.xml`) são preservados integralmente sem truncamento de stream.
