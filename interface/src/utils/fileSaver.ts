/**
 * Utilitário central e unificado para salvar arquivos (ZIP, PDF, CSV) de forma Desktop-Native ou Web.
 * 
 * - Se em Photino Desktop:
 *   Delega a seleção de destino e escrita em disco diretamente ao C# (NativeFileDialogService + Task.Run).
 *   Suporta tanto download direto de endpoints da API (sem overhead de base64) quanto dados em memória.
 *   Retorna status com sucesso comprovado ou cancelamento limpo da janela do SO.
 * 
 * - Se em Navegador Web (Modo Web ou Google AI Studio):
 *   Utiliza a moderna API showSaveFilePicker quando suportada (permitindo escolher pasta e nome),
 *   com fallback automático para Blob URL + download via tag <a>.
 */

export interface SaveOptions {
  data?: Blob | ArrayBuffer | string;
  url?: string;
  postData?: any;
  fileName: string;
  fileType?: 'zip' | 'pdf' | 'csv' | 'generic';
  title?: string;
}

export interface SaveResult {
  success: boolean;
  cancelled?: boolean;
  path?: string;
  message?: string;
}

export async function salvarArquivoNativoOuWeb(
  dataOrOptions: Blob | ArrayBuffer | string | SaveOptions,
  nomeArquivo?: string,
  tipoExtensao: 'zip' | 'pdf' | 'csv' | 'generic' = 'generic'
): Promise<SaveResult> {
  let options: SaveOptions;

  if (
    typeof dataOrOptions === 'object' &&
    !(dataOrOptions instanceof Blob) &&
    !(dataOrOptions instanceof ArrayBuffer) &&
    ('fileName' in dataOrOptions || 'url' in dataOrOptions)
  ) {
    options = dataOrOptions as SaveOptions;
  } else {
    options = {
      data: dataOrOptions as Blob | ArrayBuffer | string,
      fileName: nomeArquivo || 'arquivo',
      fileType: tipoExtensao,
    };
  }

  const fileName = options.fileName;
  const fileType = options.fileType || 'generic';

  // @ts-ignore
  const isPhotino = typeof window !== 'undefined' && window.external && typeof window.external.sendMessage === 'function';

  if (!isPhotino) {
    // Modo Web / Google AI Studio / Browser Fallback
    try {
      let blob: Blob;

      if (options.url) {
        // Busca do endpoint se foi fornecida URL em vez de Blob
        const fetchOpts: RequestInit = options.postData
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(options.postData),
            }
          : { method: 'GET' };
        const res = await fetch(options.url, fetchOpts);
        if (!res.ok) {
          throw new Error(`Erro ao baixar arquivo da API (HTTP ${res.status})`);
        }
        blob = await res.blob();
      } else if (options.data instanceof Blob) {
        blob = options.data;
      } else if (options.data instanceof ArrayBuffer) {
        blob = new Blob([options.data]);
      } else if (typeof options.data === 'string') {
        blob = new Blob([options.data], { type: 'text/plain;charset=utf-8' });
      } else {
        throw new Error('Nenhum dado ou URL fornecido para download.');
      }

      // Tenta utilizar a API nativa do navegador para salvar em pasta escolhida pelo usuário
      // @ts-ignore
      if (typeof window.showSaveFilePicker === 'function') {
        try {
          const extension = fileName.includes('.') ? fileName.split('.').pop() : fileType;
          // @ts-ignore
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: options.title || 'Arquivo',
                accept: {
                  [blob.type || 'application/octet-stream']: extension ? [`.${extension}`] : [],
                },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return { success: true };
        } catch (pickerErr: any) {
          // Se o usuário clicou em cancelar no diálogo do navegador
          if (pickerErr.name === 'AbortError') {
            return { success: false, cancelled: true };
          }
          // Caso contrário, tenta fallback via tag <a>
          console.warn('showSaveFilePicker falhou, tentando fallback <a>:', pickerErr);
        }
      }

      // Fallback tradicional via elemento <a>
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    let base64: string | undefined = undefined;

    // Se não há URL de endpoint, serializa os dados em base64
    if (!options.url && options.data) {
      if (options.data instanceof Blob) {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string) || '';
            resolve(res.includes(',') ? res.split(',')[1] : res);
          };
          reader.onerror = reject;
          reader.readAsDataURL(options.data as Blob);
        });
      } else if (options.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(options.data);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64 = btoa(binary);
      } else if (typeof options.data === 'string') {
        base64 = btoa(unescape(encodeURIComponent(options.data)));
      }
    }

    return await new Promise<SaveResult>((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('photino-web-message', onMessage);
        resolve({ success: false, message: 'Tempo limite ao aguardar janela de salvar' });
      }, 600000); // 10 minutos para o usuário navegar pelas pastas e escolher o local

      const onMessage = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (!detail) return;

        // Se a mensagem for direcionada a esta requisição específica ou for um evento de save
        if (
          detail.id === requestId ||
          (!detail.id && (detail.type === 'save-success' || detail.type === 'save-cancelled' || detail.type === 'save-error'))
        ) {
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
      window.external.sendMessage(
        JSON.stringify({
          action: 'save-file',
          id: requestId,
          fileName: fileName,
          fileType: fileType,
          title: options.title,
          url: options.url,
          postData: options.postData,
          base64: base64,
        })
      );
    });
  } catch (err: any) {
    console.error('Erro na comunicação nativa de salvamento:', err);
    return { success: false, message: err?.message || 'Erro ao salvar arquivo nativamente' };
  }
}
