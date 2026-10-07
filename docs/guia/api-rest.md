# Referência da API REST (.NET 9)

O backend do App-Recibos expõe uma API RESTful de alta performance construída sobre **ASP.NET Core Minimal APIs**, escutando por padrão em `http://127.0.0.1:5000`.

## Endpoints Disponíveis

### 1. Sistema & Saúde
- `GET /api/health`
  - **Descrição**: Healthcheck do backend local e status de localização do arquivo Excel.
  - **Retorno (200 OK)**:
    ```json
    {
      "status": "healthy",
      "version": "1.0.0",
      "excelFound": true,
      "excelPath": "/caminho/CONTROLE PAGAMENTOS.xlsx",
      "timestamp": "2026-10-06T22:00:00Z"
    }
    ```

---

### 2. Configurações do Contrato
- `GET /api/contrato`
  - Retorna as configurações do contrato pagador (`pagadorNome`, `pagadorCpf`, `tituloContrato`, `dataContrato`).
- `PUT /api/contrato`
  - Atualiza as informações contratuais.

---

### 3. Beneficiários (Cedentes)
- `GET /api/beneficiarios`
  - Retorna a lista dos 3 beneficiários com totais pagos e saldos calculados.
- `GET /api/beneficiarios/{id}`
  - Retorna um beneficiário específico.
- `PUT /api/beneficiarios/{id}`
  - Atualiza dados bancários, agência, conta ou chave Pix do beneficiário.

---

### 4. Gestão de Parcelas & Pagamentos
- `GET /api/pagamentos`
  - Retorna a lista completa de pagamentos ordenados por número da parcela e beneficiário.
- `GET /api/pagamentos/{id}`
  - Retorna os detalhes de uma parcela específica.
- `POST /api/pagamentos/{id}/quitar`
  - **Corpo (Opcional)**: `{ "dataPagamento": "2026-10-10" }`
  - **Efeito**: Marca a parcela como `PAGO`, recalcula saldos devedores de forma atômica e sincroniza com o arquivo Excel configurado.
- `POST /api/pagamentos/{id}/reverter`
  - **Efeito**: Reverte o status para `PREVISTO`, remove a data de quitação, restaura o saldo devedor e reflete na planilha Excel.
- `POST /api/pagamentos`
  - Cria um novo lançamento de parcela.
- `DELETE /api/pagamentos/{id}`
  - Remove uma parcela e recalcula os saldos remanescentes.

---

### 5. Bancos do BACEN STR
- `GET /api/bancos`
  - Retorna a listagem dos 322 bancos oficiais homologados no STR, ordenados crescentemente pelo código COMPE.

---

### 6. Emissão de Recibos Oficiais
- `GET /api/recibos/{id}/pdf`
  - Gera e devolve o fluxo de bytes do PDF (`application/pdf`) do recibo oficial da parcela liquidada.
- `POST /api/recibos/lote-zip`
  - **Corpo**: `{ "paymentIds": ["pg-1", "pg-2"] }`
  - **Retorno**: Arquivo compactado `.zip` (`application/zip`) gerado em memória RAM contendo todos os recibos individuais solicitados.

---

### 7. Sincronização Forçada com Excel
- `POST /api/sync/excel`
  - Força a leitura completa de `CONTROLE PAGAMENTOS.xlsx` e atualiza a base de dados SQLite.
