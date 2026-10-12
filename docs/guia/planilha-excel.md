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
| **D** | `STATUS` | `=IF(PARCELAS[[#This Row],[DATA PAGAMENTO]]<>"","PAGO","PREVISTO")` |
| **E** | `VALOR` | Valor da parcela (ex: `1000.00` ou `500.00`) |
| **F** | `DATA PREVISTA` | Data agendada/prevista da parcela (dia 10 do mês para parcelas futuras) |
| **G** | `DATA PAGAMENTO` | Data de quitação efetiva (preenchida apenas quando o pagamento foi realizado) |
| **H** | `FORMA PGTO` | `PIX`, `TED`, `TEV` ou `ESPÉCIE` |
| **I** | `CHAVE PIX` | `=IFERROR(INDEX(GERAL[PIX],MATCH(PARCELAS[[#This Row],[NOME]],GERAL[NOME],0)),"-")` |
| **J** | `BANCO` | `=IFERROR(INDEX(GERAL[BANCO],MATCH(PARCELAS[[#This Row],[NOME]],GERAL[NOME],0)),"-")` |
| **K** | `SALDO DEVEDOR`| Fórmula dinâmica de amortização progressiva |
| **L** | `DIA` | `=IF(OR(ISBLANK(PARCELAS[[#This Row],[DATA PAGAMENTO]]),DAY(PARCELAS[[#This Row],[DATA PAGAMENTO]])=0),"",TEXT(DAY(PARCELAS[[#This Row],[DATA PAGAMENTO]]),"00"))` |
| **M** | `MÊS` | `=IF(ISBLANK(PARCELAS[[#This Row],[DATA PAGAMENTO]]),"",TEXT(PARCELAS[[#This Row],[DATA PAGAMENTO]],"mmmm"))` |
| **N** | `ANO` | `=IF(OR(ISBLANK(PARCELAS[[#This Row],[DATA PAGAMENTO]]),YEAR(PARCELAS[[#This Row],[DATA PAGAMENTO]])=1900),"",YEAR(PARCELAS[[#This Row],[DATA PAGAMENTO]]))` |
| **O** | `CIDADE / UF` | `Maceió - AL` ou `Barra de São Miguel - AL` |

## Fórmula Nativa de Mês e Remoção da Tabela `MESES`
Com a fórmula nativa moderna do Excel 365 `=TEXT([@[DATA PAGAMENTO]], "mmmm")`, a coluna `MÊS` obtém o nome completo do mês em português diretamente a partir da data de quitação.
Isso eliminou a necessidade de qualquer tabela auxiliar `MESES` (anteriormente nas colunas Q e R), tornando a planilha mais limpa, leve e sem dependências externas.

## Proteção Contra Corrupção de Gráfico (`chart1.xml`)
Ao salvar a pasta de trabalho com o **ClosedXML**:
- O arquivo é copiado para um buffer em memória (`byte[]`).
- As alterações de células afetam estritamente os nós XML necessários (`sheet2.xml`).
- Todos os arquivos auxiliares do pacote OpenXML (`xl/drawings/drawing1.xml`, `xl/charts/chart1.xml`, `xl/calcChain.xml`) são preservados integralmente sem truncamento de stream.
