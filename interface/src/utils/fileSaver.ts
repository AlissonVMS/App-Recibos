/**
 * Utilitário central para salvar arquivos (ZIP, PDF, CSV) de forma Desktop-Native ou Web.
 * 
 * - Se em Photino Desktop:
 *   Converte os dados binários para base64 e envia mensagem via IPC (window.external.sendMessage).
 *   O Photino abre a janela nativa do SO (SaveFileDialog) com memória do último diretório escolhido,
 *   salvando o arquivo diretamente no disco.
 * 
 * - Se em Navegador Web (Modo Web ou Google AI Studio):
 *   Gera um Blob URL e aciona o download padrão via elemento <a>.
 */

export interface SaveResult {
  success: boolean;
  cancelled?: boolean;
  path?: string;
  message?: string;
}

export async function salvarArquivoNativoOuWeb(
  data: Blob | ArrayBuffer | string,
  nomeArquivo: string,
  tipoExtensao: 'zip' | 'pdf' | 'csv' | 'generic' = 'generic'
): Promise<SaveResult> {
  // @ts-ignore
  const isPhotino = typeof window !== 'undefined' && window.external && typeof window.external.sendMessage === 'function';

  if (!isPhotino) {
    // Modo Web / Google AI Studio / Browser Fallback
    try {
      const blob = typeof data === 'string' 
        ? new Blob([data], { type: 'text/plain;charset=utf-8' })
        : data instanceof Blob 
        ? data 
        : new Blob([data]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return { success: true };
    } catch (err: any) {
      console.error('Erro no download Web:', err);
      return { success: false, message: err?.message || 'Falha ao baixar arquivo' };
    }
  }

  // Modo Desktop Nativo (Photino)
  try {
    let base64 = '';
    if (data instanceof Blob) {
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = (reader.result as string) || '';
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    } else if (data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binary);
    } else if (typeof data === 'string') {
      base64 = btoa(unescape(encodeURIComponent(data)));
    }

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    return await new Promise<SaveResult>((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('photino-web-message', onMessage);
        resolve({ success: false, message: 'Tempo limite ao aguardar janela de salvar' });
      }, 180000); // 3 minutos para o usuário escolher o local

      const onMessage = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (!detail) return;

        // Se a mensagem for direcionada a esta requisição específica ou for um evento de save genérico
        if (detail.id === requestId || (!detail.id && (detail.type === 'save-success' || detail.type === 'save-cancelled' || detail.type === 'save-error'))) {
          clearTimeout(timeout);
          window.removeEventListener('photino-web-message', onMessage);

          if (detail.type === 'save-success') {
            resolve({ success: true, path: detail.path });
          } else if (detail.type === 'save-cancelled') {
            resolve({ success: false, cancelled: true });
          } else {
            resolve({ success: false, message: detail.message || 'Erro ao salvar arquivo' });
          }
        }
      };

      window.addEventListener('photino-web-message', onMessage);

      // Envia comando para o backend C# Photino
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({
        action: 'save-file',
        id: requestId,
        fileName: nomeArquivo,
        fileType: tipoExtensao,
        base64: base64
      }));
    });
  } catch (err: any) {
    console.error('Erro na comunicação nativa de salvamento:', err);
    return { success: false, message: err?.message || 'Erro ao salvar arquivo nativamente' };
  }
}
