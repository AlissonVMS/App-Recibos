using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using Photino.NET;

namespace AppRecibos.Desktop.Services;

public static class NativeFileDialogService
{
    /// <summary>
    /// Exibe a janela nativa do SO para o usuário escolher onde salvar o arquivo,
    /// com suporte ao nome padrão sugerido, memória de diretório e filtros de extensão.
    /// Deve ser chamado FORA da thread principal do GTK (ex.: dentro de Task.Run).
    /// </summary>
    public static string? ShowSaveFileDialog(
        PhotinoWindow window,
        string title,
        string initialDirectory,
        string defaultFileName,
        string extension,
        (string Name, string[] Extensions)[] filters)
    {
        // 1. No Linux, usa kdialog (KDE) ou zenity (GNOME/outros) como processo externo
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            var linuxPath = ShowLinuxSaveDialog(title, initialDirectory, defaultFileName, extension);
            if (linuxPath != null)
            {
                return string.IsNullOrWhiteSpace(linuxPath) ? null : linuxPath.Trim();
            }

            // Fallback para Photino nativo no Linux (executado na thread de UI)
            var targetDir = Directory.Exists(initialDirectory)
                ? initialDirectory
                : Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return InvokePhotinoSaveFile(window, title, targetDir, filters);
        }

        // 2. No Windows e macOS, utiliza o seletor nativo do Photino
        var defaultPath = Path.Combine(initialDirectory, defaultFileName);
        return InvokePhotinoSaveFile(window, title, defaultPath, filters);
    }

    private static string? InvokePhotinoSaveFile(
        PhotinoWindow window,
        string title,
        string defaultPath,
        (string Name, string[] Extensions)[] filters)
    {
        string? chosen = null;
        try
        {
            // Diálogos nativos do Photino precisam rodar na thread de UI
            window.Invoke(() =>
            {
                try
                {
                    chosen = window.ShowSaveFile(title, defaultPath, filters);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[NativeFileDialog] Erro no Photino ShowSaveFile: {ex.Message}");
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NativeFileDialog] Erro ao invocar diálogo Photino: {ex.Message}");
        }
        return string.IsNullOrWhiteSpace(chosen) ? null : chosen;
    }

    /// <summary>
    /// Retorna: caminho escolhido, string.Empty se o usuário cancelou,
    /// ou null se nenhuma ferramenta de diálogo funcionou (fallback para Photino).
    /// </summary>
    private static string? ShowLinuxSaveDialog(
        string title,
        string initialDirectory,
        string defaultFileName,
        string extension)
    {
        var targetDir = Directory.Exists(initialDirectory)
            ? initialDirectory
            : Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

        var suggestedFullPath = Path.Combine(targetDir, defaultFileName);
        var extClean = extension.TrimStart('.').ToLowerInvariant();

        var desktop = (Environment.GetEnvironmentVariable("XDG_CURRENT_DESKTOP") ?? "").ToUpperInvariant();
        var session = (Environment.GetEnvironmentVariable("DESKTOP_SESSION") ?? "").ToUpperInvariant();
        bool isKde = desktop.Contains("KDE") || session.Contains("PLASMA") || session.Contains("KDE")
                     || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("KDE_FULL_SESSION"));

        Func<string?>[] attempts = isKde
            ? [() => TryKdialog(title, suggestedFullPath, extClean), () => TryZenity(title, suggestedFullPath, extClean)]
            : [() => TryZenity(title, suggestedFullPath, extClean), () => TryKdialog(title, suggestedFullPath, extClean)];

        foreach (var attempt in attempts)
        {
            var result = attempt();
            if (result != null) return result;
        }

        return null; // Sinaliza fallback para Photino nativo
    }

    private static string? TryKdialog(string title, string suggestedFullPath, string extClean)
    {
        var bin = ResolveCommandPath("kdialog");
        if (bin == null) return null;

        var filterArg = extClean switch
        {
            "zip" => "*.zip *.ZIP|Arquivos ZIP (*.zip)",
            "pdf" => "*.pdf *.PDF|Documentos PDF (*.pdf)",
            "csv" => "*.csv *.CSV|Planilhas CSV (*.csv)",
            _ => $"*.{extClean}|Arquivos (*.{extClean})"
        };

        // --title deve vir antes da ação posicional --getsavefilename
        return RunDialogProcess(bin, extClean,
            "--title", title,
            "--getsavefilename", suggestedFullPath, filterArg);
    }

    private static string? TryZenity(string title, string suggestedFullPath, string extClean)
    {
        var bin = ResolveCommandPath("zenity");
        if (bin == null) return null;

        var filterName = extClean switch
        {
            "zip" => "Arquivos ZIP (*.zip)",
            "pdf" => "Documentos PDF (*.pdf)",
            "csv" => "Planilhas CSV (*.csv)",
            _ => $"Arquivos (*.{extClean})"
        };
        var filterPattern = extClean switch
        {
            "zip" => "*.zip *.ZIP",
            "pdf" => "*.pdf *.PDF",
            "csv" => "*.csv *.CSV",
            _ => $"*.{extClean}"
        };

        return RunDialogProcess(bin, extClean,
            "--file-selection",
            "--save",
            $"--title={title}",
            $"--filename={suggestedFullPath}",
            $"--file-filter={filterName} | {filterPattern}",
            "--file-filter=Todos os arquivos | *");
    }

    /// <summary>
    /// Executa a ferramenta de diálogo. Retorna caminho, string.Empty (cancelado) ou null (falha).
    /// </summary>
    private static string? RunDialogProcess(string bin, string extClean, params string[] args)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = bin,
                RedirectStandardOutput = true,
                // stderr NÃO é redirecionado: avisos do GTK/Qt poderiam encher o pipe e travar o processo
                RedirectStandardError = false,
                RedirectStandardInput = false,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            foreach (var a in args) psi.ArgumentList.Add(a);

            foreach (var key in new[] { "DISPLAY", "WAYLAND_DISPLAY", "XAUTHORITY", "DBUS_SESSION_BUS_ADDRESS", "XDG_RUNTIME_DIR", "XDG_CURRENT_DESKTOP", "HOME" })
            {
                var val = Environment.GetEnvironmentVariable(key);
                if (!string.IsNullOrEmpty(val)) psi.Environment[key] = val;
            }

            using var process = Process.Start(psi);
            if (process == null) return null;

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();

            if (process.ExitCode == 0 && !string.IsNullOrWhiteSpace(output))
            {
                var selected = output.Trim().Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)[0];
                if (!Path.HasExtension(selected) && !string.IsNullOrEmpty(extClean))
                {
                    selected += "." + extClean;
                }
                return selected;
            }

            // ExitCode 1 = usuário cancelou / fechou a janela
            if (process.ExitCode == 1) return string.Empty;

            Console.WriteLine($"[NativeFileDialog] {Path.GetFileName(bin)} retornou código {process.ExitCode}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NativeFileDialog] {Path.GetFileName(bin)} falhou: {ex.Message}");
        }
        return null;
    }

    private static string? ResolveCommandPath(string command)
    {
        string[] candidates = [$"/usr/bin/{command}", $"/usr/sbin/{command}", $"/usr/local/bin/{command}", $"/bin/{command}"];
        foreach (var c in candidates)
        {
            if (File.Exists(c)) return c;
        }

        var pathVar = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in pathVar.Split(':', StringSplitOptions.RemoveEmptyEntries))
        {
            var full = Path.Combine(dir, command);
            if (File.Exists(full)) return full;
        }

        return null;
    }
}
