using System.Net.Http;
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
        try
        {
            var window = new PhotinoWindow()
                .SetTitle("App-Recibos - Gestão Financeira & Recibos Civis")
                .SetSize(1280, 860)
                .SetMinSize(900, 600)
                .Center()
                .SetResizable(true)
                .Load(targetUrl);

            window.WaitForClose();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[App-Recibos Desktop] Interface gráfica não pôde ser aberta (ambiente headless ou sem display): {ex.Message}");
            Console.WriteLine("[App-Recibos Desktop] Mantendo backend ativo em http://127.0.0.1:5000...");
            apiTask.Wait();
        }
    }
}
