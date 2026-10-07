# 📜 App-Recibos: Sistema de Gestão Financeira e Emissão de Recibos Civis

[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![QuestPDF](https://img.shields.io/badge/QuestPDF-2026.9-EC4899)](https://www.questpdf.com/)
[![ClosedXML](https://img.shields.io/badge/ClosedXML-0.105-107C41?logo=microsoftexcel&logoColor=white)](https://github.com/ClosedXML/ClosedXML)
[![SQLite](https://img.shields.io/badge/SQLite-Dapper-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![GitHub Pages](https://img.shields.io/badge/Docs-GitHub%20Pages-22C55E?logo=github&logoColor=white)](https://alissonvms.github.io/App-Recibos/)

> **Sistema Corporativo de Gestão Financeira, Controle de Amortização Contratual e Emissão de Recibos Civis de Quitação Plena** com arquitetura híbrida Desktop/Web, sincronização Excel bidirecional concorrente e conformidade estrita aos padrões do Banco Central do Brasil (BACEN STR).

---

## 🎯 Visão Geral do Projeto

O **App-Recibos** foi desenvolvido para gerenciar contratos de cessão de direitos hereditários e parcelamentos patrimoniais entre familiares/partes envolvidas, unindo:
1. **Controle Financeiro Confiável**: Amortização dinâmica de saldo devedor, conferência de parcelas pagas e agendadas.
2. **Sincronização Excel com Preservação Total**: Leitura e escrita atômica em planilhas Excel (`CONTROLE PAGAMENTOS.xlsx`) sem romper tabelas estruturadas, gráficos nativos (`chart1.xml`) ou fórmulas dinâmicas (`INDEX`, `MATCH`, `COUNTIF`, `SUMPRODUCT`).
3. **Conformidade BACEN STR**: Cadastro e seleção inteligente entre os 322 bancos do Sistema de Transferência de Reservas (STR) em Title Case, ordenados por código COMPE (`001` a `804`), com purificação estrita de nomes nos recibos civis (sem código e sem apelidos parentéticos).
4. **Geração Oficial de Recibos em PDF**: Motor nativo em C# com **QuestPDF** operando **100% em memória RAM** (zero arquivos temporários em disco), gerando vias individuais e pacotes em lote ZIP com fidelidade milimétrica ao modelo oficial (`RECIBO SIMPLES.docm`).

---

## 🏗️ Arquitetura do Sistema

O projeto adota uma arquitetura limpa e desacoplada em três frentes principais:

```
App-Recibos/
├── interface/               # Frontend Moderno (React 19 + TypeScript + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/      # Componentes UX/UI (Controle Geral, Tabela, Modal de Quitação, Preview)
│   │   ├── data/            # Participantes BACEN STR, dados contratuais e bancos
│   │   ├── services/        # Cliente REST API (apiService) com fallback offline
│   │   └── utils/           # Extenso PT-BR, PDF jsPDF fallback, máscaras e helpers
│   └── vite.config.ts       # Proxy reverso para API C# em http://localhost:5000
│
├── core/                    # Backend Nativo C# .NET 9
│   ├── src/
│   │   ├── AppRecibos.Core/ # Domínio, Repositórios SQLite, Motor Excel e Gerador QuestPDF
│   │   │   ├── Domain/      # Entidades (Contrato, Beneficiário, Pagamento) e Enums
│   │   │   ├── Infrastructure/
│   │   │   │   ├── Data/    # SQLite com Dapper e Migrações
│   │   │   │   └── Excel/   # Motor de Sincronização ExcelSyncEngine (ClosedXML)
│   │   │   └── Services/    # PaymentService, SyncService, QuestPdfReceiptGenerator, NumberToWords
│   │   └── AppRecibos.Api/  # ASP.NET Core Minimal APIs (Porta 5000)
│   └── tests/
│       └── AppRecibos.Tests/# Suíte de Testes Automatizados (xUnit, FluentAssertions, Mvc.Testing)
│
└── docs/                    # Portal de Documentação Oficial (VitePress para GitHub Pages)
```

---

## ⚡ Funcionalidades em Destaque

### 1. Motor de Sincronização Excel ClosedXML
- Leitura e atualização de células no `CONTROLE PAGAMENTOS.xlsx` com segurança contra bloqueio de arquivo (FileShare.ReadWrite com jitter exponencial).
- Preservação intacta de estruturas OpenXML: metadados, formatações condicionais, tabelas `GERAL`, `PARCELAS` e `MESES`.
- Fallback semântico inteligente para fórmulas de repetição (`COUNTIF`) e amortização de contratos.

### 2. Padrão Oficial do Recibo Civil (`.docm`)
- Layout A4 rigoroso: Margem superior 30mm, esquerda 30mm, direita 20mm, inferior 20mm.
- Tipografia Times New Roman 12pt com entrelinha de 1,5 e título 14pt em negrito.
- Cláusula padrão de quitação plena, geral e irrevogável com identificação de chave Pix limpa:
  > *Pagamento recebido através da chave Pix nº (82)99929-1488, Caixa Econômica Federal.*
- Nomes de bancos padronizados: `Nu Pagamentos S.A.` (sem o sufixo `(Nubank)` e sem o código `260 -`).

### 3. Operação em Memória (Zero Disco Temporário)
- Geração de PDF via QuestPDF utilizando buffers de `MemoryStream`.
- Emissão em lote gerando arquivos `.zip` em memória via `System.IO.Compression.ZipArchive`.

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** 20+ e **npm**
- **.NET 9 SDK** (instalado em `~/.dotnet` ou padrão do sistema)

### Modo Desenvolvimento Rápido (Recomendado)
Execute o script utilitário na raiz do projeto:

```bash
./run-dev.sh
```

A interface web estará disponível em **http://localhost:3000**.

### Executando o Backend C# .NET 9
Em outro terminal:

```bash
cd core/src/AppRecibos.Api
dotnet run
```

O servidor da API iniciará em **http://127.0.0.1:5000**. O Vite em `localhost:3000` redireciona automaticamente requisições `/api/*` para o backend.

### Executando o Aplicativo Desktop Compilado (Janela Nativa)
O aplicativo possui executável nativo compilado com janela leve (Photino / WebKitGTK) e backend C# integrado:

```bash
# Executar diretamente pelo script launcher:
./abrir-app.sh

# Ou pelo atalho na Área de Trabalho:
# Clique duas vezes em "App Recibos" na sua Área de Trabalho
```

Também é possível iniciar diretamente no navegador padrão sem janela desktop:
```bash
./abrir-app.sh --browser
```

### Executando a Suíte de Testes Automatizados
Todos os testes de domínio, ClosedXML, QuestPDF e integração HTTP da API podem ser executados com:

```bash
dotnet test core/tests/AppRecibos.Tests/AppRecibos.Tests.csproj
```

---

## 🛡️ Diretrizes de Segurança Turbo

Para garantir estabilidade contínua durante operações aceleradas:
1. **Backups Automáticos**: Todo processo de atualização na planilha gera snapshot com timestamp na pasta `.backups/`.
2. **Sanitização de Diretório**: Arquivos de teste e logs temporários são mantidos estritamente em memória ou no diretório temporário do sistema operacional (`Path.GetTempPath()`), nunca no repositório.
3. **Resiliência a Desconexão**: Se o backend C# não estiver em execução, a interface React opera normalmente através de armazenamento local persistente (`localStorage`).

---

## 📖 Documentação Completa (GitHub Pages)

A documentação viva do projeto, manuais de usuário, guias de arquitetura e especificações de API estão disponíveis em:
👉 **[https://alissonvms.github.io/App-Recibos/](https://alissonvms.github.io/App-Recibos/)**

---

## 📄 Licença

Este projeto é desenvolvido para uso privado e corporativo. Todos os direitos reservados.
