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
    /// </summary>
    public static string? ShowSaveFileDialog(
        PhotinoWindow window,
        string title,
        string initialDirectory,
        string defaultFileName,
        string extension,
        (string Name, string[] Extensions)[] filters)
    {
        // 1. No Linux, prioriza zenity e kdialog para ter pré-preenchimento perfeito do nome do arquivo
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            var linuxPath = ShowLinuxSaveDialog(title, initialDirectory, defaultFileName, extension);
            if (linuxPath != null)
            {
                return string.IsNullOrWhiteSpace(linuxPath) ? null : linuxPath.Trim();
            }

            // Fallback para Photino nativo no Linux (passando apenas a pasta como diretório para o GTK)
            try
            {
                var targetDir = Directory.Exists(initialDirectory) 
                    ? initialDirectory 
                    : Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

                var chosen = window.ShowSaveFile(title, targetDir, filters);
                if (!string.IsNullOrWhiteSpace(chosen))
                {
                    return chosen;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NativeFileDialog] Erro no fallback Photino Linux: {ex.Message}");
            }
            return null;
        }

        // 2. No Windows e macOS, utiliza o seletor nativo do Photino
        try
        {
            var defaultPath = Path.Combine(initialDirectory, defaultFileName);
            var chosen = window.ShowSaveFile(title, defaultPath, filters);
            return string.IsNullOrWhiteSpace(chosen) ? null : chosen;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NativeFileDialog] Erro no Photino ShowSaveFile: {ex.Message}");
            return null;
        }
    }

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

        // Tentativa 1: zenity (padrão em GNOME, BigLinux, Ubuntu, Debian, Arch)
        var zenityBin = ResolveCommandPath("zenity");
        if (zenityBin != null)
        {
            try
            {
                var extClean = extension.TrimStart('.').ToLowerInvariant();
                var filterArg = extClean switch
                {
                    "zip" => "--file-filter=Arquivos ZIP (*.zip) | *.zip *.ZIP",
                    "pdf" => "--file-filter=Documentos PDF (*.pdf) | *.pdf *.PDF",
                    "csv" => "--file-filter=Planilhas CSV (*.csv) | *.csv *.CSV",
                    _ => $"--file-filter=Arquivos (*.{extClean}) | *.{extClean}"
                };

                var psi = new ProcessStartInfo
                {
                    FileName = zenityBin,
                    Arguments = $"--file-selection --save --confirm-overwrite --title=\"{EscapeArg(title)}\" --filename=\"{EscapeArg(suggestedFullPath)}\" {filterArg} \"--file-filter=Todos os arquivos | *\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi);
                if (process != null)
                {
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

                    // ExitCode 1 = usuário cancelou
                    if (process.ExitCode == 1)
                    {
                        return string.Empty; // Cancelado explicitamente
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NativeFileDialog] Zenity falhou: {ex.Message}");
            }
        }

        // Tentativa 2: kdialog (padrão KDE)
        var kdialogBin = ResolveCommandPath("kdialog");
        if (kdialogBin != null)
        {
            try
            {
                var extClean = extension.TrimStart('.').ToLowerInvariant();
                var filterArg = extClean switch
                {
                    "zip" => "*.zip|Arquivos ZIP (*.zip)",
                    "pdf" => "*.pdf|Documentos PDF (*.pdf)",
                    "csv" => "*.csv|Planilhas CSV (*.csv)",
                    _ => $"*.{extClean}|Arquivos (*.{extClean})"
                };

                var psi = new ProcessStartInfo
                {
                    FileName = kdialogBin,
                    Arguments = $"--getsavefilename \"{EscapeArg(suggestedFullPath)}\" \"{EscapeArg(filterArg)}\" --title \"{EscapeArg(title)}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi);
                if (process != null)
                {
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

                    if (process.ExitCode == 1)
                    {
                        return string.Empty; // Cancelado
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NativeFileDialog] Kdialog falhou: {ex.Message}");
            }
        }

        return null; // Sinaliza fallback para Photino nativo
    }

    private static string? ResolveCommandPath(string command)
    {
        string[] candidates = [$"/usr/bin/{command}", $"/usr/sbin/{command}", $"/usr/local/bin/{command}"];
        foreach (var c in candidates)
        {
            if (File.Exists(c)) return c;
        }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "which",
                Arguments = command,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                var outStr = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit();
                if (proc.ExitCode == 0 && !string.IsNullOrWhiteSpace(outStr))
                {
                    var resolved = outStr.Trim().Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)[0];
                    if (File.Exists(resolved)) return resolved;
                }
            }
        }
        catch { }

        return null;
    }

    private static string EscapeArg(string arg)
    {
        return arg.Replace("\"", "\\\"");
    }
}
