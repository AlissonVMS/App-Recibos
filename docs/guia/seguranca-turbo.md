# Diretrizes de Segurança Turbo

Para operar em desenvolvimento contínuo e acelerado (**Modo Turbo**) sem risco de perda de dados ou regressões técnicas, o projeto estabelece regras mandatórias de engenharia.

## Princípios Norteadores

### 1. Política de Backup Obrigatório Pré-Mutação
Nenhum arquivo físico de usuário (em especial `CONTROLE PAGAMENTOS.xlsx`) pode ser alterado sem a criação prévia de uma cópia snapshot na pasta `.backups/`:
- Formato do arquivo de backup: `.backups/CONTROLE_PAGAMENTOS_{timestamp}.xlsx`
- O diretório `.backups/` é ignorado no controle de versão (`.gitignore`).

### 2. Zero Arquivos Temporários em Disco
- A geração de documentos PDF (QuestPDF) e compactação ZIP opera estritamente em **memória RAM** (`MemoryStream` / `byte[]`).
- Testes automatizados que necessitem de arquivos SQLite ou Excel utilizam caminhos temporários do sistema operacional (`Path.GetTempPath()`) e removem os artefatos no bloco `finally`.

### 3. Concorrência Segura e Anti-Bloqueio
- O acesso a arquivos de planilhas utiliza o modo `FileShare.ReadWrite`.
- Em caso de contenção por outro processo (por exemplo, arquivo aberto no Microsoft Excel ou LibreOffice pelo usuário), o motor aciona **5 tentativas com jitter exponencial** antes de falhar.

### 4. Portões de Validação Estritos (Gates)
Cada fase do projeto deve cumprir simultaneamente:
- **0 erros de compilação** (`dotnet build` com saída exit code 0).
- **0 avisos impeditivos** (warnings tratados proativamente).
- **100% de testes aprovados** (`dotnet test` e `npm run build` passando com sucesso).
- **Commits Atômicos**: Cada entrega funcional é commitada e enviada para o repositório remoto com mensagem semântica clara.
