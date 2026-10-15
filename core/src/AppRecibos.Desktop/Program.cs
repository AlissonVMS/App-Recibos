using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;
using Photino.NET;

namespace AppRecibos.Desktop;

public class Program
{
    [StructLayout(LayoutKind.Sequential)]
    private struct GdkRGBA
    {
        public double Red;
        public double Green;
        public double Blue;
        public double Alpha;
    }

    [DllImport("libwebkit2gtk-4.1.so.0", EntryPoint = "webkit_web_view_set_background_color", SetLastError = false)]
    private static extern void webkit_web_view_set_background_color_41(IntPtr webView, ref GdkRGBA rgba);

    [DllImport("libwebkit2gtk-4.0.so.37", EntryPoint = "webkit_web_view_set_background_color", SetLastError = false)]
    private static extern void webkit_web_view_set_background_color_40(IntPtr webView, ref GdkRGBA rgba);

    [DllImport("libgtk-3.so.0", SetLastError = false)]
    private static extern void gtk_widget_set_opacity(IntPtr widget, double opacity);

    private static (IntPtr gtkWindow, IntPtr webView) GetNativeGtkPointers(PhotinoWindow window)
    {
        try
        {
            var nativeField = typeof(PhotinoWindow).GetField("_nativeInstance", BindingFlags.NonPublic | BindingFlags.Instance);
            if (nativeField?.GetValue(window) is IntPtr nativeInst && nativeInst != IntPtr.Zero)
            {
                // Linux x64 Photino:
                // offset 0x110 = GtkWidget* (GtkWindow)
                // offset 0xc8  = WebKitWebView*
                IntPtr gtkWindow = Marshal.ReadIntPtr(nativeInst + 0x110);
                IntPtr webView = Marshal.ReadIntPtr(nativeInst + 0xc8);
                return (gtkWindow, webView);
            }
        }
        catch { }
        return (IntPtr.Zero, IntPtr.Zero);
    }

    private static void SetWebKitBackgroundColor(IntPtr webView, double r, double g, double b, double a)
    {
        var color = new GdkRGBA { Red = r, Green = g, Blue = b, Alpha = a };
        try
        {
            webkit_web_view_set_background_color_41(webView, ref color);
        }
        catch (DllNotFoundException)
        {
            try
            {
                webkit_web_view_set_background_color_40(webView, ref color);
            }
            catch { }
        }
        catch { }
    }

    private static void SetGtkOpacity(IntPtr widget, double opacity)
    {
        try
        {
            gtk_widget_set_opacity(widget, opacity);
        }
        catch { }
    }

    [STAThread]
    public static void Main(string[] args)
    {
        // Otimização Linux: desativa DMA-BUF renderer no WebKitGTK para eliminar o atraso de inicialização do driver gráfico
        Environment.SetEnvironmentVariable("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

        Console.WriteLine("[App-Recibos Desktop] Iniciando backend C# .NET 9...");

        // 1. Inicia o backend ASP.NET Core em background
        var apiProgramType = typeof(global::Program);
        var entryPoint = apiProgramType.Assembly.EntryPoint;

        var apiTask = Task.Run(() =>
        {
            try
            {
                entryPoint?.Invoke(null, [args]);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[App-Recibos Desktop] Erro na API: {ex.Message}");
            }
        });

        // Se passado argumento --api-only, apenas aguarda a API
        if (args.Contains("--api-only") || args.Contains("--headless"))
        {
            Console.WriteLine("[App-Recibos Desktop] Modo API-Only ativo. Aguardando requisições em http://127.0.0.1:5000...");
            apiTask.Wait();
            return;
        }

        string targetUrl = "http://127.0.0.1:5000";
        var httpClient = new HttpClient { Timeout = TimeSpan.FromMilliseconds(200) };
        string lastSaveDir = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        
        try
        {
            // 2. Cria a janela nativa Photino IMEDIATAMENTE (em paralelo ao boot do backend)
            Console.WriteLine("[App-Recibos Desktop] Inicializando janela nativa Photino...");
            string baseDir = AppContext.BaseDirectory;
            string iconName = System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows)
                ? "app-icon.ico" 
                : "app-icon.png";
            string iconPath = Path.Combine(baseDir, iconName);

            var window = new PhotinoWindow()
                .SetTitle("App-Recibos - Gestão Financeira & Recibos Civis")
                .SetIconFile(iconPath)
                .SetSize(1280, 860)
                .SetMinSize(900, 600)
                .Center()
                .SetResizable(true)
                .SetContextMenuEnabled(false)
                .SetDevToolsEnabled(false)
                .SetLogVerbosity(0)
                .SetGrantBrowserPermissions(true);

            IntPtr nativeGtkWindow = IntPtr.Zero;
            bool isWindowShown = false;
            var showLock = new object();

            void ShowWindowOnce()
            {
                lock (showLock)
                {
                    if (isWindowShown) return;
                    isWindowShown = true;
                }
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    try
                    {
                        window.Invoke(() =>
                        {
                            if (nativeGtkWindow == IntPtr.Zero)
                            {
                                var (gtkWin, _) = GetNativeGtkPointers(window);
                                nativeGtkWindow = gtkWin;
                            }
                            if (nativeGtkWindow != IntPtr.Zero)
                            {
                                SetGtkOpacity(nativeGtkWindow, 1.0);
                                Console.WriteLine("[App-Recibos Desktop] Janela exibida instantaneamente (100% pronta, 0ms flash).");
                            }
                        });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[App-Recibos Desktop] Erro ao exibir janela: {ex.Message}");
                    }
                }
            }

            window.RegisterWindowCreatedHandler((sender, e) =>
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    var (gtkWin, webView) = GetNativeGtkPointers(window);
                    nativeGtkWindow = gtkWin;
                    if (gtkWin != IntPtr.Zero)
                    {
                        // Começa com opacidade 0 para evitar o frame branco preliminar do WebKitGTK
                        SetGtkOpacity(gtkWin, 0.0);
                    }
                    if (webView != IntPtr.Zero)
                    {
                        // Define cor de fundo nativa do WebKitGTK para dark slate (#0f172a)
                        SetWebKitBackgroundColor(webView, 15.0 / 255.0, 23.0 / 255.0, 42.0 / 255.0, 1.0);
                    }
                }
            });

            window.RegisterWebMessageReceivedHandler((sender, message) =>
            {
                var w = sender as PhotinoWindow ?? window;
                if (w == null) return;

                // Handshake do React quando o DOM inicial estiver 100% montado e renderizado
                if (message == "react-pronto")
                {
                    ShowWindowOnce();
                    return;
                }

                // Executa completamente em Task.Run para liberar imediatamente a thread principal do GTK
                Task.Run(async () =>
                {
                    string reqId = "";
                    try
                    {
                        if (message == "request-save-csv")
                        {
                            var defaultFileName = $"CONTROLE_PAGAMENTOS_{DateTime.Now:yyyy-MM-dd}.csv";
                            var filters = new (string, string[])[] { ("Planilha CSV (*.csv)", new[] { "csv" }), ("Todos os arquivos", new[] { "*" }) };
                            
                            var path = Services.NativeFileDialogService.ShowSaveFileDialog(
                                w,
                                "Salvar Planilha de Pagamentos CSV",
                                lastSaveDir,
                                defaultFileName,
                                "csv",
                                filters);
                            
                            if (string.IsNullOrWhiteSpace(path))
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new { type = "save-cancelled" }));
                                return;
                            }

                            if (!Path.HasExtension(path)) path += ".csv";
                            var dir = Path.GetDirectoryName(path);
                            if (!string.IsNullOrWhiteSpace(dir)) lastSaveDir = dir;

                            var csvBytes = await httpClient.GetByteArrayAsync($"{targetUrl}/api/export/csv");
                            await File.WriteAllBytesAsync(path, csvBytes);
                            w.SendWebMessage(JsonSerializer.Serialize(new { type = "save-success", path = path, fileName = Path.GetFileName(path) }));
                            return;
                        }

                        // Handler universal JSON para salvar arquivos (ZIP, PDF, CSV, etc.) com janela nativa do SO
                        if (!string.IsNullOrWhiteSpace(message) && message.TrimStart().StartsWith("{"))
                        {
                            using var doc = JsonDocument.Parse(message);
                            var root = doc.RootElement;
                            if (!root.TryGetProperty("action", out var actionProp) || actionProp.GetString() != "save-file")
                            {
                                return;
                            }

                            var id = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
                            reqId = id;
                            var fileName = root.TryGetProperty("fileName", out var fnProp) ? fnProp.GetString() ?? "arquivo" : "arquivo";
                            var title = root.TryGetProperty("title", out var tProp) ? tProp.GetString() : null;
                            var fileType = root.TryGetProperty("fileType", out var ftProp) ? ftProp.GetString()?.ToLowerInvariant() : null;
                            var base64 = root.TryGetProperty("base64", out var b64Prop) ? b64Prop.GetString() : null;
                            var url = root.TryGetProperty("url", out var uProp) ? uProp.GetString() : null;
                            bool hasPostData = root.TryGetProperty("postData", out var postDataProp);
                            string? postDataJson = hasPostData ? postDataProp.GetRawText() : null;

                            var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
                            if (string.IsNullOrEmpty(ext))
                            {
                                ext = fileType switch
                                {
                                    "zip" => "zip",
                                    "pdf" => "pdf",
                                    "csv" => "csv",
                                    _ => "dat"
                                };
                                fileName += "." + ext;
                            }

                            var dialogTitle = title ?? ext switch
                            {
                                "zip" => "Salvar Pacote de Recibos em ZIP",
                                "pdf" => "Salvar Recibo em PDF",
                                "csv" => "Salvar Planilha de Pagamentos CSV",
                                _ => "Salvar Arquivo"
                            };

                            (string, string[])[] filters = ext switch
                            {
                                "zip" => new (string, string[])[] { ("Arquivo ZIP (*.zip)", new[] { "zip" }), ("Todos os arquivos", new[] { "*" }) },
                                "pdf" => new (string, string[])[] { ("Documento PDF (*.pdf)", new[] { "pdf" }), ("Todos os arquivos", new[] { "*" }) },
                                "csv" => new (string, string[])[] { ("Planilha CSV (*.csv)", new[] { "csv" }), ("Todos os arquivos", new[] { "*" }) },
                                _ => new (string, string[])[] { ($"Arquivo (*.{ext})", new[] { ext }), ("Todos os arquivos", new[] { "*" }) }
                            };

                            // Executa diálogo nativo desacoplado na thread background (evita deadlock com o loop GTK)
                            var selectedPath = Services.NativeFileDialogService.ShowSaveFileDialog(
                                w,
                                dialogTitle,
                                lastSaveDir,
                                fileName,
                                ext,
                                filters);

                            if (string.IsNullOrWhiteSpace(selectedPath))
                            {
                                // Usuário cancelou ou fechou a janela
                                w.SendWebMessage(JsonSerializer.Serialize(new { type = "save-cancelled", id }));
                                return;
                            }

                            if (!Path.HasExtension(selectedPath) && !string.IsNullOrEmpty(ext))
                            {
                                selectedPath += "." + ext;
                            }

                            var dir = Path.GetDirectoryName(selectedPath);
                            if (!string.IsNullOrWhiteSpace(dir)) lastSaveDir = dir;

                            byte[] fileBytes;
                            if (!string.IsNullOrEmpty(url))
                            {
                                var fullUrl = url.StartsWith("http") ? url : $"{targetUrl}{url}";
                                if (!string.IsNullOrEmpty(postDataJson))
                                {
                                    using var content = new StringContent(postDataJson, System.Text.Encoding.UTF8, "application/json");
                                    var resp = await httpClient.PostAsync(fullUrl, content);
                                    resp.EnsureSuccessStatusCode();
                                    fileBytes = await resp.Content.ReadAsByteArrayAsync();
                                }
                                else
                                {
                                    fileBytes = await httpClient.GetByteArrayAsync(fullUrl);
                                }
                            }
                            else if (!string.IsNullOrEmpty(base64))
                            {
                                fileBytes = Convert.FromBase64String(base64);
                            }
                            else
                            {
                                throw new InvalidOperationException("Nenhum dado binário (base64 ou url) fornecido.");
                            }

                            await File.WriteAllBytesAsync(selectedPath, fileBytes);
                            w.SendWebMessage(JsonSerializer.Serialize(new 
                            { 
                                type = "save-success", 
                                id, 
                                path = selectedPath, 
                                fileName = Path.GetFileName(selectedPath) 
                            }));
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[AppRecibos Desktop] Erro no handler de salvar arquivo: {ex.Message}");
                        w.SendWebMessage(JsonSerializer.Serialize(new 
                        { 
                            type = "save-error", 
                            id = reqId,
                            message = ex.Message 
                        }));
                    }
                });
            });

            // 3. Aguarda o backend responder no healthcheck (ultra-rápido, executado em paralelo)
            bool devRequested = args.Contains("--dev");

            if (devRequested)
            {
                try
                {
                    var res = httpClient.GetAsync("http://localhost:3000").GetAwaiter().GetResult();
                    if (res.IsSuccessStatusCode)
                    {
                        targetUrl = "http://localhost:3000";
                        Console.WriteLine($"[App-Recibos Desktop] Modo Dev: Conectando a {targetUrl}");
                    }
                }
                catch { }
            }

            if (targetUrl.StartsWith("http://127.0.0.1:5000"))
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();
                while (sw.ElapsedMilliseconds < 5000)
                {
                    try
                    {
                        var res = httpClient.GetAsync("http://127.0.0.1:5000/api/health").GetAwaiter().GetResult();
                        if (res.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"[App-Recibos Desktop] Backend pronto em {sw.ElapsedMilliseconds}ms.");
                            break;
                        }
                    }
                    catch
                    {
                        Thread.Sleep(5);
                    }
                }

                // 4. Pré-aquece o cache de arquivos estáticos e as rotas de banco antes de exibir a janela
                try
                {
                    _ = httpClient.GetStringAsync("http://127.0.0.1:5000/").GetAwaiter().GetResult();
                    _ = httpClient.GetStringAsync("http://127.0.0.1:5000/api/pagamentos").GetAwaiter().GetResult();
                    _ = httpClient.GetStringAsync("http://127.0.0.1:5000/api/contrato").GetAwaiter().GetResult();
                    _ = httpClient.GetStringAsync("http://127.0.0.1:5000/api/beneficiarios").GetAwaiter().GetResult();
                }
                catch { }
            }

            // Fallback de segurança: se o handshake react-pronto demorar mais de 2s, revela a janela para evitar travamentos
            Task.Delay(2000).ContinueWith(_ => ShowWindowOnce());

            window.Load(targetUrl);
            window.WaitForClose();
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[App-Recibos Desktop] Interface gráfica não pôde ser aberta (ambiente headless ou sem display): {ex.Message}");
            Console.WriteLine("[App-Recibos Desktop] Mantendo backend ativo em http://127.0.0.1:5000...");
            apiTask.Wait();
        }
    }
}
