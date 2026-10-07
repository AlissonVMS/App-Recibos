# Recibos Civis Oficiais (`.docm`)

A emissão de recibos civis no App-Recibos reproduz com fidelidade milimétrica a estrutura do modelo formal original registrado em `RECIBO SIMPLES.docm`.

## Estrutura Formal do Documento

O recibo é estruturado em uma única folha A4 com as seguintes especificações tipográficas:

- **Formato de Página**: A4 Retrato (`210mm x 297mm`)
- **Margens**:
  - Superior: `30mm` (3,0 cm)
  - Esquerda: `30mm` (3,0 cm)
  - Direita: `20mm` (2,0 cm)
  - Inferior: `20mm` (2,0 cm)
- **Tipografia**: Times New Roman 12pt (Título 14pt em Negrito)
- **Espaçamento entre Linhas**: 1,5x
- **Alinhamento do Corpo**: Justificado com hifenação e microtipografia

## Texto Oficial Modelo

```text
Recibo de Pagamento

1ª VIA

Eu, ELISANGELA MARIA VASCONCELOS DE ARAÚJO, inscrito(a) no CPF nº 341.267.018-93, declaro que recebi de ABIGAIL PAULINO DA SILVA, CPF nº 450.519.504-00, a quantia de R$ 1.000,00 (mil reais), no dia 11/05/2026, referente à parcela nº 9 do Contrato de Promessa de Cessão de Direitos Hereditários, firmado em 19 de agosto de 2025.

Pagamento recebido através da chave Pix nº (82)99929-1488, Caixa Econômica Federal.

Após este pagamento, o saldo devedor atualizado referente à minha parte é de R$ 8.500,00 (oito mil e quinhentos reais).

Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.

Barra de São Miguel - AL, 11 de maio de 2026

__________________________________________________________________________________
ELISANGELA MARIA VASCONCELOS DE ARAÚJO
CPF: 341.267.018-93
```

## Motor QuestPDF em Memória (RAM)

Diferente de implementações convencionais que gravam arquivos intermediários no disco rígido (sujeitos a fragmentação e lentidão em operações concorrentes), o App-Recibos implementa o pipeline 100% em memória:

```csharp
// Geração pura em memória RAM
var pdfBytes = generator.GerarReciboPdf(dados);
return Results.File(pdfBytes, "application/pdf", fileName);
```

### Emissão em Lote (Arquivo ZIP)
Na interface, o usuário pode selecionar múltiplas parcelas pagas e solicitar a emissão em lote. O backend empacota os PDFs diretamente em um fluxo de memória compactado via `ZipArchive` e entrega o arquivo para download em uma única requisição HTTP.
