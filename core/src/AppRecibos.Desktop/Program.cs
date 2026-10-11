using System.IO;
using System.Net.Http;
using System.Text.Json;
using Photino.NET;

namespace AppRecibos.Desktop;

public class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
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

        // 2. Aguarda a API subir respondendo no healthcheck
        var httpClient = new HttpClient { Timeout = TimeSpan.FromMilliseconds(500) };
        for (int i = 0; i < 20; i++)
        {
            try
            {
                var res = httpClient.GetAsync("http://127.0.0.1:5000/api/health").GetAwaiter().GetResult();
                if (res.IsSuccessStatusCode)
                {
                    Console.WriteLine("[App-Recibos Desktop] Backend conectado com sucesso na porta 5000.");
                    break;
                }
            }
            catch
            {
                Thread.Sleep(250);
            }
        }

        // 3. Determina a URL inicial da interface
        string targetUrl = "http://127.0.0.1:5000";
        bool devRequested = args.Contains("--dev");

        if (devRequested)
        {
            try
            {
                var res = httpClient.GetAsync("http://localhost:3000").GetAwaiter().GetResult();
                if (res.IsSuccessStatusCode)
                {
                    targetUrl = "http://localhost:3000";
                    Console.WriteLine($"[App-Recibos Desktop] Modo Desenvolvimento: Conectando ao Vite em {targetUrl}");
                }
            }
            catch
            {
                Console.WriteLine("[App-Recibos Desktop] Dev server não respondeu; usando backend local em http://127.0.0.1:5000");
            }
        }
        else
        {
            Console.WriteLine($"[App-Recibos Desktop] Interface integrada ativa em: {targetUrl}");
        }

        // 4. Cria e exibe a janela nativa Photino
        Console.WriteLine("[App-Recibos Desktop] Abrindo janela nativa leve Photino...");
        string lastSaveDir = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        
        try
        {
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
                .SetGrantBrowserPermissions(true);

            window.RegisterWebMessageReceivedHandler((sender, message) =>
            {
                var w = (PhotinoWindow)sender;

                if (message == "request-save-csv")
                {
                    var defaultFileName = $"CONTROLE_PAGAMENTOS_{DateTime.Now:yyyy-MM-dd}.csv";
                    var defaultPath = Path.Combine(lastSaveDir, defaultFileName);
                    var filters = new (string, string[])[] { ("Planilha CSV (*.csv)", new[] { "csv" }), ("Todos os arquivos", new[] { "*" }) };
                    
                    // Executa a janela nativa de diálogo na thread principal de UI
                    var path = w.ShowSaveFile("Salvar Planilha de Pagamentos CSV", defaultPath, filters);
                    
                    if (!string.IsNullOrWhiteSpace(path))
                    {
                        if (!Path.HasExtension(path)) path += ".csv";
                        var dir = Path.GetDirectoryName(path);
                        if (!string.IsNullOrWhiteSpace(dir)) lastSaveDir = dir;

                        Task.Run(async () => 
                        {
                            try
                            {
                                var csvBytes = await httpClient.GetByteArrayAsync($"{targetUrl}/api/export/csv");
                                await File.WriteAllBytesAsync(path, csvBytes);
                                w.SendWebMessage(JsonSerializer.Serialize(new { type = "save-success", path = path }));
                            }
                            catch (Exception ex)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new { type = "save-error", message = ex.Message }));
                            }
                        });
                    }
                    else
                    {
                        w.SendWebMessage(JsonSerializer.Serialize(new { type = "save-cancelled" }));
                    }
                    return;
                }

                // Handler universal JSON para salvar arquivos (ZIP, PDF, CSV, etc.) com janela nativa do SO
                if (!string.IsNullOrWhiteSpace(message) && message.TrimStart().StartsWith("{"))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(message);
                        var root = doc.RootElement;
                        if (!root.TryGetProperty("action", out var actionProp) || actionProp.GetString() != "save-file")
                        {
                            return;
                        }

                        var id = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
                        var fileName = root.TryGetProperty("fileName", out var fnProp) ? fnProp.GetString() ?? "arquivo" : "arquivo";
                        var title = root.TryGetProperty("title", out var tProp) ? tProp.GetString() : null;
                        var fileType = root.TryGetProperty("fileType", out var ftProp) ? ftProp.GetString()?.ToLowerInvariant() : null;
                        var base64 = root.TryGetProperty("base64", out var b64Prop) ? b64Prop.GetString() : null;
                        var url = root.TryGetProperty("url", out var uProp) ? uProp.GetString() : null;

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

                        var defaultPath = Path.Combine(lastSaveDir, fileName);
                        
                        // Executa ShowSaveFile NA THREAD PRINCIPAL DE UI DO GTK/PHOTINO
                        var selectedPath = w.ShowSaveFile(dialogTitle, defaultPath, filters);

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

                        // Gravação em disco e requisição assíncrona desacopladas da UI
                        Task.Run(async () =>
                        {
                            try
                            {
                                byte[] fileBytes;
                                if (!string.IsNullOrEmpty(base64))
                                {
                                    fileBytes = Convert.FromBase64String(base64);
                                }
                                else if (!string.IsNullOrEmpty(url))
                                {
                                    fileBytes = await httpClient.GetByteArrayAsync($"{targetUrl}{url}");
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
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[AppRecibos Desktop] Erro ao gravar arquivo: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new 
                                { 
                                    type = "save-error", 
                                    id, 
                                    message = ex.Message 
                                }));
                            }
                        });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[AppRecibos Desktop] Erro no handler de salvar arquivo: {ex.Message}");
                        w.SendWebMessage(JsonSerializer.Serialize(new 
                        { 
                            type = "save-error", 
                            message = ex.Message 
                        }));
                    }
                }
            });

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
