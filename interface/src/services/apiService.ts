import { Beneficiary, ContractConfig, PaymentRecord } from '../types';

const API_BASE = '/api';

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
      return await res.json();
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
      return await res.json();
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
      return await res.json();
    } catch {
      return null;
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo || `recibo-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
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
