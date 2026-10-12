import { Beneficiary, ContractConfig, PaymentRecord } from '../types';
import { salvarArquivoNativoOuWeb } from '../utils/fileSaver';

const API_BASE = '/api';

export const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function normalizarPagamento(p: any): PaymentRecord {
  const dataRef = p.dataPagamento || p.dataPrevista || p.data || '';
  let dia = p.dia ? String(p.dia).padStart(2, '0') : '';
  let mes = p.mes ? String(p.mes).trim() : '';
  let ano = p.ano ? String(p.ano).trim() : '';

  // Se o mês for puramente numérico ou resíduo (ex: "30000"), converter ou limpar
  if (mes && !isNaN(Number(mes))) {
    const mesNum = parseInt(mes, 10);
    if (mesNum >= 1 && mesNum <= 12) {
      mes = MESES_PT[mesNum - 1];
    } else {
      mes = '';
    }
  }

  if ((!dia || !mes || !ano) && dataRef && dataRef.includes('-')) {
    const parts = dataRef.split('-');
    if (parts.length === 3) {
      ano = ano || parts[0];
      const mesNum = parseInt(parts[1], 10);
      if (!mes && mesNum >= 1 && mesNum <= 12) {
        mes = MESES_PT[mesNum - 1];
      }
      dia = dia || parts[2].padStart(2, '0');
    }
  }

  if (mes && isNaN(Number(mes))) {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
  }

  return {
    ...p,
    status: (p.status?.toString().toUpperCase() === 'PREVISTO' ? 'PREVISTO' : 'PAGO') as 'PAGO' | 'PREVISTO',
    dia: dia || '',
    mes: mes || '',
    ano: ano || '',
    data: p.data || dataRef,
  };
}

export const apiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getContrato(): Promise<ContractConfig | null> {
    try {
      const res = await fetch(`${API_BASE}/contrato`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateContrato(contrato: ContractConfig): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/contrato`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contrato),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getBeneficiarios(): Promise<Beneficiary[] | null> {
    try {
      const res = await fetch(`${API_BASE}/beneficiarios`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateBeneficiario(id: string, ben: Beneficiary): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/beneficiarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ben),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getPagamentos(): Promise<PaymentRecord[] | null> {
    try {
      const res = await fetch(`${API_BASE}/pagamentos`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.map((p: any) => normalizarPagamento(p));
    } catch {
      return null;
    }
  },

  async quitarPagamento(id: string, dataPagamento?: string): Promise<PaymentRecord | null> {
    try {
      const res = await fetch(`${API_BASE}/pagamentos/${id}/quitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPagamento }),
      });
      if (!res.ok) return null;
      return normalizarPagamento(await res.json());
    } catch {
      return null;
    }
  },

  async reverterPagamento(id: string): Promise<PaymentRecord | null> {
    try {
      const res = await fetch(`${API_BASE}/pagamentos/${id}/reverter`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return normalizarPagamento(await res.json());
    } catch {
      return null;
    }
  },

  async quitarPagamentosLote(ids: string[], dataPagamento?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/pagamentos/lote/quitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, dataPagamento }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async reverterPagamentosLote(ids: string[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/pagamentos/lote/reverter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async excluirPagamento(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/pagamentos/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async baixarPdfRecibo(id: string, nomeArquivo?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/recibos/${id}/pdf`);
      if (!res.ok) return false;
      const blob = await res.blob();
      const saveRes = await salvarArquivoNativoOuWeb(blob, nomeArquivo || `recibo-${id}.pdf`, 'pdf');
      return saveRes.success;
    } catch {
      return false;
    }
  },

  async baixarLoteZip(paymentIds: string[], nomeArquivo = 'recibos.zip'): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/recibos/lote-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIds }),
      });
      if (!res.ok) return false;
      const blob = await res.blob();
      const saveRes = await salvarArquivoNativoOuWeb(blob, nomeArquivo, 'zip');
      return saveRes.success;
    } catch {
      return false;
    }
  },

  async syncExcel(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/sync/excel`, { method: 'POST' });
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error || '' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de conexão' };
    }
  },
};
