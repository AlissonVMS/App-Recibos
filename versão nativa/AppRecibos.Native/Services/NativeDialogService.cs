using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Avalonia.Controls;
using Avalonia.Platform.Storage;

namespace AppRecibos.Native.Services;

public class NativeDialogService
{
    public static async Task<string?> ShowSaveFileDialogAsync(
        Window parent,
        string title,
        string defaultFileName,
        string extension,
        string filterName)
    {
        var topLevel = TopLevel.GetTopLevel(parent);
        if (topLevel == null) return null;

        var filePickerTypes = new List<FilePickerFileType>
        {
            new FilePickerFileType(filterName)
            {
                Patterns = new[] { $"*.{extension}" }
            },
            FilePickerFileTypes.All
        };

        var file = await topLevel.StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions
        {
            Title = title,
            SuggestedFileName = defaultFileName,
            DefaultExtension = extension,
            FileTypeChoices = filePickerTypes
        });

        return file?.Path.LocalPath;
    }

    public static void OpenPathWithDefaultApp(string filePath)
    {
        try
        {
            if (!File.Exists(filePath) && !Directory.Exists(filePath)) return;

            if (OperatingSystem.IsWindows())
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = filePath,
                    UseShellExecute = true
                });
            }
            else if (OperatingSystem.IsMacOS())
            {
                Process.Start("open", filePath);
            }
            else
            {
                Process.Start("xdg-open", filePath);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NativeDialogService] Erro ao abrir arquivo: {ex.Message}");
        }
    }
}
