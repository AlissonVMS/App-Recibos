using System;
using System.Threading.Tasks;
using Avalonia.Controls;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Native.Services;
using AppRecibos.Native.ViewModels;

namespace AppRecibos.Native.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    protected override void OnDataContextChanged(EventArgs e)
    {
        base.OnDataContextChanged(e);

        if (DataContext is MainWindowViewModel vm)
        {
            vm.OnRequestPaymentDialog = async (existing) =>
            {
                var dialogVm = new PaymentDialogViewModel(vm.Beneficiarios, existing);
                var dialog = new PaymentDialog(dialogVm);
                var isOk = await dialog.ShowDialog<bool>(this);
                if (isOk)
                {
                    var novoPag = dialogVm.ToPagamento();
                    // Salva no repositório SQLite
                    try
                    {
                        var repo = new AppRecibos.Core.Infrastructure.Data.Repositories.PagamentoRepository(
                            new AppRecibos.Core.Infrastructure.Data.SqliteDbConnectionFactory());
                        
                        await repo.SaveAsync(novoPag);
                        return true;
                    }
                    catch (Exception ex)
                    {
                        vm.ShowNotification($"Erro ao salvar no SQLite: {ex.Message}", "error");
                        return false;
                    }
                }
                return false;
            };

            vm.OnRequestBeneficiaryDialog = async (beneficiario) =>
            {
                var dialogVm = new BeneficiaryDialogViewModel(beneficiario, vm.Contrato);
                var dialog = new BeneficiaryDialog(dialogVm);
                var isOk = await dialog.ShowDialog<bool>(this);
                if (isOk)
                {
                    var updated = dialogVm.ToUpdatedBeneficiario();
                    try
                    {
                        var repo = new AppRecibos.Core.Infrastructure.Data.Repositories.BeneficiarioRepository(
                            new AppRecibos.Core.Infrastructure.Data.SqliteDbConnectionFactory());
                        await repo.SaveAsync(updated);
                        return true;
                    }
                    catch (Exception ex)
                    {
                        vm.ShowNotification($"Erro ao salvar beneficiário: {ex.Message}", "error");
                        return false;
                    }
                }
                return false;
            };

            // Emissão de recibos ocorre dentro da própria janela principal em overlay A4 (1:1 ao React, sem nova janela do SO)
            vm.OnRequestReceiptPreviewDialog = null;

            // Tecla ESC fecha a conferência de recibo e retorna imediatamente à tabela de pagamentos
            AddHandler(KeyDownEvent, (s, e) =>
            {
                if (e.Key == Avalonia.Input.Key.Escape)
                {
                    if (DataContext is MainWindowViewModel mvm && mvm.IsReceiptPreviewOpen)
                    {
                        mvm.CloseReceiptPreviewCommand.Execute(null);
                        e.Handled = true;
                    }
                }
            }, Avalonia.Interactivity.RoutingStrategies.Tunnel);

            vm.OnRequestSaveFileDialog = async (title, defaultFileName, extension, filterName) =>
            {
                return await NativeDialogService.ShowSaveFileDialogAsync(this, title, defaultFileName, extension, filterName);
            };

            vm.OnOpenFilePath = (filePath) =>
            {
                NativeDialogService.OpenPathWithDefaultApp(filePath);
            };
        }
    }
}
