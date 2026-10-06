export interface Beneficiary {
  id: string;
  nome: string;
  cpf: string;
  contrato: number;
  pago: number;
  saldo: number;
  status: 'EM ABERTO' | 'QUITADO';
  banco: string;
  agencia: string;
  conta: string;
  operacao?: string;
  tipoConta: 'POUPANÇA' | 'CORRENTE';
  chavePix: string;
  tipoChavePix?: 'CPF' | 'CNPJ' | 'E-MAIL' | 'TELEFONE' | 'ALEATÓRIA';
  cidadeUf: string;
}

export interface PaymentRecord {
  id: string;
  nome: string;
  cpf: string;
  parcela: number;
  valor: number;
  data: string; // YYYY-MM-DD
  dataPrevista?: string; // Data agendada/prevista (ex: 2026-09-10)
  dataPagamento?: string; // Data de quitação efetiva (ex: 2026-09-11)
  status?: 'PAGO' | 'PREVISTO'; // Status de execução da parcela
  formaPgto: string;
  chave: string;
  tipoChavePix?: 'CPF' | 'CNPJ' | 'E-MAIL' | 'TELEFONE' | 'ALEATÓRIA';
  banco: string;
  saldo: number;
  dia: string;
  mes: string;
  ano: string;
  cidadeUf: string;
  observacoes?: string;
}

export interface ContractConfig {
  pagadorNome: string;
  pagadorCpf: string;
  pagadorBanco?: string; // ex: '104 - Caixa Econômica Federal'
  tituloContrato: string;
  dataContrato: string;
}
